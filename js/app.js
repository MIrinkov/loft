/**
 * Created by hlfrmn on 9/17/2016.
 */
angular.module('loft', ['ngDialog'])
    .factory('Customer', function () {
        function Customer(name, id, start, discountPercent, freeMinutes, orders) {
            this.name = name || '';
            this.id = id || null;
            // an option to start from a known point in time (e.g. if restoring from back-up)
            this.start = start || Date.now();
            this.discount = discountPercent || 0;
            //if discount is in percents, convert it to rate
            if (this.discount >= 1)
                this.discount = parseFloat(discountPercent) / 100;
            this.freeMinutes = parseInt(freeMinutes, 10) || 0;
            // an option to start from
            this.orders = orders || [];
        }

        Customer.prototype.addOrder = function (order) {
            this.orders.push(order);
        };
        Customer.prototype.deleteOrder = function (order) {
            var index = this.orders.indexOf(order);
            if (index > -1) {
                this.orders.splice(index, 1);
            }
            else {
                console.log("Order deletion error - order not found.");
            }
        };

        Customer.fromObj = function (obj) {
            return new Customer(
                obj.name,
                obj.id,
                obj.start,
                obj.discountPercent,
                obj.freeMinutes,
                obj.orders)
        };

        return Customer;
    })
    .factory('Order', function orderFactory() {
        function Order(description, price) {
            this.description = description || '';
            this.price = parseInt(price, 10) || 0;
        }

        Order.fromObj = function (obj) {
            return new Order(
                obj.description,
                obj.price
            );
        };
        return Order;
    })
    .service('Appraiser', function () {
        var self = this;
        var prices = {
            minuteCost: 2,          // the first 60 minutes cost this much
            cheapMinuteCost: 1.5,   // all subsequent minutes cost this much
            expensiveMinutes: 60,   // how many minutes have increased cost
            maximumBill: 350        // total bill for minutes cannot exceed this limit
        };

        // how much customer owes for time
        this.appraiseTime = function (msTotal, discount, freeMinutes) {
            // convert to minutes and subtract the free minutes
            var minutesTotal = Math.round(msTotal / (1000 * 60)) - freeMinutes;
            if (minutesTotal < 0) minutesTotal = 0; // money shouldn't be negative
            if (minutesTotal > prices.expensiveMinutes) {
                var expensiveCost = prices.expensiveMinutes * prices.minuteCost;
                var cheapCost = (minutesTotal - prices.expensiveMinutes) * prices.cheapMinuteCost;
                var total = expensiveCost + cheapCost;
                // apply discount
                total *= (1 - discount);
                return Math.min(total, prices.maximumBill)
            }
            return Math.round(prices.minuteCost * minutesTotal * (1 - discount));
        };

        // how much customer owes for orders
        this.appraiseOrders = function (orders) {
            var total = 0;
            orders.forEach(function (order) {
                total += order.price;
            });
            return total
        };

        // shorthand for getting the whole bill for a customer
        this.appraiseCustomer = function (customer, msTotal) {
            var ordersBill = self.appraiseOrders(customer.orders);
            var timeBill = self.appraiseTime(msTotal, customer.discount, customer.freeMinutes);
            return ordersBill + timeBill;
        }
    })
    .service('loftStorage', ['$window', 'Order', 'Customer', function ($window, Order, Customer) {

        function save(array) {
            // saves main customer array to localStorage, IGNORES EMPTY ARRAYS
            if (array.length !== 0)
                $window.localStorage.loftStorage = angular.toJson(array);
        }

        function restore() {
            // builds and returns a new customer array using Order and Customer constructors
            var json = $window.localStorage.loftStorage;
            if (json == null)
                return [];
            var array = angular.fromJson(json);
            // first convert orders to Order instances, then get Customer instances
            return array.map(function (customer) {
                customer.orders = customer.orders.map(Order.fromObj);
                return Customer.fromObj(customer);
            });
        }

        this.clear = function () {
            delete $window.localStorage.loftStorage;
        };

        this.init = function ($scope) {
            scope = $scope;
            scope.customers = restore();
            $scope.$watch('customers', save, true)
        };

    }])
    .filter('msToTime', function () {
        return function (ms) {
            // converts milliseconds to readable time string, like "1 h 20 m 13 s"

            var oneSecond = 1000;
            var oneMinute = oneSecond * 60;
            var oneHour = oneMinute * 60;

            var seconds = Math.floor((ms % oneMinute) / oneSecond);
            var minutes = Math.floor((ms % oneHour) / oneMinute);
            var hours = Math.floor(ms / oneHour);

            var timeString = '';
            if (hours !== 0)
                timeString += hours + ' h ';
            if (minutes !== 0)
                timeString += minutes + ' m ';
            if (seconds !== 0 || ms < 1000)
                timeString += seconds + ' s';

            return timeString;
        };
    })
    .controller('MainController', ['$scope', '$interval', '$window', 'Customer', 'loftStorage', function ($scope, $interval, $window, Customer, loftStorage) {
        $scope.customers = [];      // the main array that keeps all customers
        $scope.newCustomer = {      // an object bound to the form
            name: "",
            id: "",
            start: 0,
            discountPercent: null,
            freeMinutes: null
        };
        loftStorage.init($scope);

        $scope.addCustomer = function () {
            // add current time
            $scope.newCustomer.start = Date.now();
            // push the customer to container, RETURNS a positive integer USED in the view
            return $scope.customers.push(Customer.fromObj($scope.newCustomer));
        };

        $scope.deleteAll = function () {
            var confirmed = $window.confirm('Are you sure you want to DELETE ALL CUSTOMERS?');
            if (!confirmed) return;
            // first clear the array, then call loftStorage.clear(), since loftStorage.save() ignores empty arrays
            $scope.customers = [];
            loftStorage.clear();
        };

        $scope.resetForm = function (form) {
            $scope.newCustomer = {
                name: "",
                id: "",
                start: 0,
                discountPercent: null,
                freeMinutes: null
            };

            // get form controls, filtering out angular properties that are prefixed with '$'
            var controlNames = Object.keys(form).filter(function (key) {
                return key.indexOf('$') !== 0
            });

            // set the values to undefined, to avoid validation messages after submitting the form
            controlNames.map(function (name) {
                var control = form[name];
                control.$setViewValue(undefined);
            });

            form.$setPristine();
            form.$setUntouched();
        };


    }])
    .controller('DetailsController', ['$scope', 'Order', function ($scope, Order) {
        $scope.newOrder = {
            description: "",
            price: null
        };
        $scope.addOrder = function () {
            var order = Order.fromObj($scope.newOrder);
            $scope.customer.addOrder(order);
            $scope.newOrder.description = "";
            $scope.newOrder.price = null;
        };

        $scope.deleteOrder = function (order) {
            $scope.customer.deleteOrder(order);
        };
    }])
    .directive('loftCustomer', ['$interval', 'ngDialog', 'Appraiser', function ($interval, ngDialog, Appraiser) {
        return {
            replace: true,
            templateUrl: 'customer.html',
            controller: function personalCustomerController($scope) {
                //function for opening the modal
                $scope.openCustomerDetails = function () {
                    ngDialog.open({
                        template: 'details.html',
                        controller: 'DetailsController',
                        scope: $scope,
                        classname: 'ngdialog-theme-default'
                    });
                };
            },
            scope: {
                customer: '='
            },
            link: function (scope, element) {
                scope.timeTotal = 0;
                scope.moneyTotal = 0;

                function updateTime() {
                    // gets the total ms fom start until now
                    scope.timeTotal = Date.now() - scope.customer.start;
                }

                function updateMoney() {
                    // get the bill for time, get the bill for orders, sum them up
                    scope.moneyTotal = Appraiser.appraiseCustomer(scope.customer, scope.timeTotal);
                }

                // update time and money every second
                var timeInterval = $interval(updateTime, 1000);
                var moneyInterval = $interval(updateMoney, 1000);

                // clear the intervals to prevent a memory leak
                element.on('$destroy', function () {
                    $interval.cancel(moneyInterval);
                    $interval.cancel(timeInterval);
                });
            }
        };

    }]);
