/**
 * Created by hlfrmn on 9/17/2016.
 */
angular.module('loft', ['ngDialog'])
    .factory('Customer', function () {
        // customer object factory
        function Customer(id, name, start, discountPercent, freeMinutes) {
            this.name = name || '';
            this.id = id || null;
            // an option to start from a known point in time (e.g. if restoring from back-up)
            this.start = start || Date.now();
            this.discount = parseInt(discountPercent, 10)/100 || 0;
            this.freeMinutes = parseInt(freeMinutes, 10) || 0;

            this.orders = [];
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
                console.log('Order deletion error - order not found.');
            }
        };

        Customer.fromObj = function (obj) {
            return new Customer(
                obj.id,
                obj.name,
                obj.start,
                obj.discountPercent,
                obj.freeMinutes)
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
                total *= (1-discount);
                return Math.min(total, prices.maximumBill)
            }
            return Math.round(prices.minuteCost * minutesTotal * (1 - discount));
        };

        // how much customer owes for orders
        this.appraiseOrders = function (orders) {
            var total = 0;
            orders.forEach(function (order) {
                total+= order.price;
            });
            console.log('orders: ',total);
            return total
        };

        // shorthand for getting the whole bill for a customer
        this.appraiseCustomer = function (customer, msTotal) {
            var ordersBill = self.appraiseOrders(customer.orders);
            var timeBill = self.appraiseTime(msTotal, customer.discount, customer.freeMinutes);
            return ordersBill + timeBill;
        }
    })
    .filter('msToTime', function () {
        return function (ms) {
            var oneSecond = 1000;
            var oneMinute = oneSecond * 60;
            var oneHour = oneMinute * 60;

            var seconds = Math.floor((ms % oneMinute) / oneSecond);
            var minutes = Math.floor((ms % oneHour) / oneMinute);
            var hours = Math.floor(ms / oneHour);

            var timeString = '';
            if (hours !== 0) {
                timeString += hours + ' h '
            }
            if (minutes !== 0) {
                timeString += minutes + ' m ';
            }
            if (seconds !== 0 || ms < 1000) {
                timeString += seconds + ' s ';
            }

            return timeString;
        };
    })
    .controller('MainController', function ($scope, $interval, Customer) {
        $scope.customers = [];
        $scope.newCustomer = {
            name: "",
            id: "",
            start: 0,
            discountPercent: null,
            freeMinutes: null
        }
        ;
        $scope.addCustomer = function () {
            // add current time
            $scope.newCustomer.start = Date.now();
            // push the customer to container
            $scope.customers.push(Customer.fromObj($scope.newCustomer));
            // reset the form
            $scope.newCustomer.name = "";
            $scope.newCustomer.id = "";
            $scope.newCustomer.start = 0;
            $scope.newCustomer.discountPercent = null;
            $scope.newCustomer.freeMinutes = null;
        };

    })
    .controller('DetailsController', function ($scope, ngDialog, Order) {
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
    })
    .directive('loftCustomer', function ($interval, ngDialog, Appraiser) {
        return {
            replace: true,
            templateUrl: 'customer.html',
            controller: function personalCustomerController($scope) {
                //function for opening the modal
                $scope.openCustomerDetails = function (customer) {
                    console.log('clicked');
                    console.log($scope);
                    ngDialog.open({
                        template: 'details.html',
                        controller: 'DetailsController',
                        scope: $scope,
                        classname: 'ngdialog-theme-default'
                    });
                    console.log($scope);
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

                var moneyInterval = $interval(updateMoney, 1000);
                var timeInterval = $interval(updateTime, 1000);

                // clear the intervals to prevent a memory leak
                element.on('$destroy', function () {
                    $interval.cancel(moneyInterval);
                    $interval.cancel(timeInterval);
                });
            }
        };

    });
