/**
 * Created by hlfrmn on 9/17/2016.
 */
angular.module('loft', ['ngDialog'])
    .factory('Customer', function () {
        function Customer(name, id, start, discount, freeMinutes, orders) {
            this.name = name || '';
            this.id = id || '';
            // an option to start from a known point in time (e.g. if restoring from back-up)
            this.start = start || Date.now();

            //if discount is in percents(int), convert it to rate(float)
            if (Number(discount) === discount && discount % 1 === 0)
                this.discount = parseFloat(discount) / 100;
            else
                this.discount = discount;

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
                obj.discount,
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
                total = Math.round(total * (1 - discount));
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
            // converts milliseconds to readable time string, like "1 h 20 m"

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
            if (hours == 0)
            // only show seconds when there are no hours
                timeString += seconds + ' s';

            return timeString;
        };
    })
    .filter('rubleCurrency', function () {
        return function (moneyAmount, decimalLimit) {
            var ruble_sign = "руб";
            var limit = parseInt(decimalLimit, 10) || 0;
            var amount = parseFloat(moneyAmount);
            if (!amount) return "";
            return amount.toFixed(limit) + ' ' + ruble_sign;
        }
    })
    .controller('MainController', ['$scope', '$window', 'Customer', 'loftStorage', function ($scope, $window, Customer, loftStorage) {
        $scope.customers = [];      // the main array that keeps all customers
        $scope.newCustomer = {      // an object bound to the form
            name: "",
            id: "",
            start: 0,
            discount: null,
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

            form.$setPristine();
            form.$setUntouched();

            $scope.newCustomer.name = "";
            $scope.newCustomer.id = "";
            $scope.newCustomer.start = 0;
            $scope.newCustomer.discount = null;
            $scope.newCustomer.freeMinutes = null;
        };


    }])
    .controller('DetailsController', ['$scope', '$window', 'Order', function ($scope, $window, Order) {
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

        $scope.checkOut = function () {
            var confirmed = $window.confirm('Checkout the customer?');
            if (!confirmed) return;
            var payed = $window.confirm('Received payment from the customer?');
            if (!payed) return;
            $scope.customer.checkedOut = $scope.timeTotal;
        };

        $scope.changeDiscount = function () {
            var current_discount = ($scope.customer.discount * 100) + '%';
            var new_discount = $window.prompt("The discount is set to " + current_discount + ". Enter new discount percentage:");
            new_discount = parseInt(new_discount, 10);
            if (new_discount >= 0 && new_discount <= 100)
                $scope.customer.discount = new_discount / 100;
        }
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
                var timeInterval, moneyInterval;

                scope.timeTotal = 0;
                scope.moneyTotal = 0;

                function updateTime() {
                    // gets the total ms fom start until now
                    scope.timeTotal = Date.now() - scope.customer.start;
                    if (scope.customer.checkedOut) {
                        $interval.cancel(timeInterval);
                    }
                }

                function updateMoney() {
                    // get the bill for time, get the bill for orders, sum them up
                    scope.moneyTotal = Appraiser.appraiseCustomer(scope.customer, scope.timeTotal);
                }

                // update time and money every second
                timeInterval = $interval(updateTime, 1000);
                moneyInterval = $interval(updateMoney, 1000);

                // clear the intervals to prevent a memory leak
                element.on('$destroy', function () {
                    $interval.cancel(moneyInterval);
                    $interval.cancel(timeInterval);
                });
            }
        };

    }]);
