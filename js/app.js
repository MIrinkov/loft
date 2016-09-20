/**
 * Created by hlfrmn on 9/17/2016.
 */
angular.module('loft', ['ngDialog'])
    .factory('Customer', function () {
        function Customer(id, name, start, discount) {
            this.name = name || '';
            this.id = id || null;
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
    .factory('Order', function () {
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
            minuteCost: 2,
            cheapMinuteCost: 1.5,
            expensiveMinutes: 60,
            maxMinutePrice: 350
        };

        this.appraiseTime = function (customer) {
            var minutesTotal = Math.round((Date.now() - customer.start) / (1000 * 60));
            if (minutesTotal > prices.expensiveMinutes) {
                var expensiveCost = prices.expensiveMinutes * prices.minuteCost;
                var cheapCost = (minutesTotal - prices.expensiveMinutes) * prices.cheapMinuteCost;
                return Math.round(expensiveCost + cheapCost)
            }
            else
                return Math.round(prices.minuteCost * minutesTotal)
        }
    })
    .controller('MainController', function ($scope, $interval, ngDialog, Customer, Appraiser) {
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
            console.log('Customer added. Customers: ', $scope.customers)
        };
        $scope.customerDetails = function (customer) {
            ngDialog.open({
                template: 'details.html',
                controller: 'DetailsController',
                data: {
                    customer: customer
                }
            })
        };
    })
    .controller('DetailsController', function ($scope, ngDialog, Order) {
        var currentCustomer = $scope.ngDialogData.customer;
        $scope.newOrder = {
            description: "",
            price: null
        };
        $scope.orders = currentCustomer.orders;

        $scope.addOrder = function () {
            var order = Order.fromObj($scope.newOrder);
            currentCustomer.addOrder(order);
            $scope.newOrder.description = "";
            $scope.newOrder.price = null;
        };

        $scope.deleteOrder = function (order) {
            currentCustomer.deleteOrder(order)
        };
    })
    .controller('customerController', function ($scope) {
        $scope.volatile = {
            msTotal:null,
            moneyTotal:null
        };
        function updateTime() {
            var ms = (Date.now - $scope.customer.start);
            updateMoney()
        }
        function updateMoney() {

        }
    })
    .directive('loftCustomer', function ($interval) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'customer.html',
            controller:'customerController',
            scope: {
                customer:'='
            }
        }
    });