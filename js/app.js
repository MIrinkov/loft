/**
 * Created by hlfrmn on 9/17/2016.
 */
angular.module('loft', ['ngDialog'])
    .factory('Customer', function () {
        // customer object factory
        function Customer(id, name, start, discount) {
            this.name = name || '';
            this.id = id || null;
            // an option to start from a known point in time (e.g. if restoring from back-up)
            this.start = start || Date.now();
            this.discount = parseFloat(discount) || 0;

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
                obj.discount)
        };

        return Customer;
    })
    .factory('Order', function orderFactory() {
        function Order(description, price) {
            this.description = description || '';
            this.price = parseInt(price) || 0;
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
        var prices = {
            minuteCost: 2,          // the first 60 minutes cost this much
            cheapMinuteCost: 1.5,   // all subsequent minutes cost this much
            expensiveMinutes: 60,   // how many minutes have increased cost
            maximumBill: 350        // total bill for minutes cannot exceed this limit
        };

        this.appraiseTime = function (msTotal) {
            var minutesTotal = Math.round(msTotal / (1000 * 60));
            if (minutesTotal > prices.expensiveMinutes) {
                var expensiveCost = prices.expensiveMinutes * prices.minuteCost;
                var cheapCost = (minutesTotal - prices.expensiveMinutes) * prices.cheapMinuteCost;
                var total = expensiveCost + cheapCost;
                return total > prices.maximumBill ? prices.maximumBill : total;
            }
            return Math.round(prices.minuteCost * minutesTotal);
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
            start: null,
            discount: null
        };
        $scope.addCustomer = function () {
            // add current time
            $scope.newCustomer.start = Date.now();
            // push the customer to container
            $scope.customers.push(Customer.fromObj($scope.newCustomer));
            // reset the form
            $scope.newCustomer.name = "";
            $scope.newCustomer.id = "";
            $scope.newCustomer.start = null;
            $scope.newCustomer.discount = null;
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
    .directive('loftCustomer', function ($interval, ngDialog, Appraiser, msToTimeFilter) {
        return {
            replace: true,
            templateUrl: 'customer.html',
            controller: function personalCustomerController($scope) {

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
                    scope.timeTotal = Date.now() - scope.customer.start;
                }
                function updateMoney() {
                    scope.moneyTotal = Appraiser.appraiseTime(scope.timeTotal);
                }

                var moneyInterval = $interval(updateMoney, 1000);
                var timeInterval = $interval(updateTime, 1000);

                element.on('$destroy', function () {
                    $interval.cancel(moneyInterval);
                    $interval.cancel(timeInterval);
                });
            }
        };

    });