(function() {
    'use strict';

    angular.module('frontend.core.controllers')
        .controller('GridController', ['$scope', '$q', '_', '$timeout', 'SocketHelperService', grid]);

    function grid($scope, $q, _, $timeout, SocketHelperService) {
        $scope.sort = {
            column: 'id',
            direction: false
        };

        // Initialize filters
        function initFilters () {
          $scope.filters = {
              searchWord: '',
              columns: []
          };
        }
        initFilters();

        // Function to change sort column / direction on list
        $scope.changeSort = function changeSort(item) {
            var sort = $scope.sort;

            if (sort.column === item.column) {
                sort.direction = !sort.direction;
            } else {
                sort.column = item.column;
                sort.direction = true;
            }
        };

        var firstRun = true;
        var dataSource = {
            pageSize: parseInt($scope.itemsPerPage),
            getRows: function(params) {
                if (params.sortModel.length) {
                    $scope.changeSort({
                        column: params.sortModel[0].field
                    });
                }

                var delay = 0;
                if (Object.keys(params.filterModel).length) {
                    delay = 400;
                    setFilters(params.filterModel);
                }
                else{
                    initFilters();
                }

                $scope.currentPage = params.startRow / $scope.itemsPerPage + 1;

                if (firstRun) {
                    params.successCallback($scope.items, $scope.itemCount);
                    firstRun = false;
                    return;
                }

                _fetchData()
                    .then(function() {
                        params.successCallback($scope.items, $scope.itemCount);
                    });
            }
        };

        var setFilters = function(filterModel) {
            var columns = [];
            var searchWord = '';
            for (var prop in filterModel) {
                if (filterModel.hasOwnProperty(prop)) {
                    searchWord = filterModel[prop].filter;
                    columns.push({
                        column: prop,
                        inSearch: true
                    });
                }
            }
            $scope.filters = {
                searchWord: searchWord,
                columns: columns
            };
        };

        $scope.gridOptions = {
            enableServerSideSorting: true,
            enableServerSideFilter: true,
            suppressUnSort: true,
            datasource: dataSource,
            columnDefs: $scope.columnDefs,
            cellValueChanged:function (params) {
                var id = params.data.id;
                $scope.Model.update(id, params.data);
            }
        };

        function _fetchData() {
            $scope.loading = true;

            // Common parameters for count and data query
            var commonParameters = {
                where: SocketHelperService.getWhere($scope.filters)
            };

            // Data query specified parameters
            var parameters = {
                limit: $scope.itemsPerPage,
                skip: ($scope.currentPage - 1) * $scope.itemsPerPage,
                sort: $scope.sort.column + ' ' + ($scope.sort.direction ? 'ASC' : 'DESC')
            };

            if ($scope.populate) {
                parameters.populate = $scope.populate;
            }
            // Fetch data count
            var count = $scope.Model
                .count(commonParameters)
                .then(
                    function onSuccess(response) {
                        $scope.itemCount = response.count;
                    }
                );

            // Fetch actual data
            var load = $scope.Model
                .load(_.merge({}, commonParameters, parameters))
                .then(
                    function onSuccess(response) {
                        $scope.items = response;
                    }
                );

            // Load all needed data
            return $q
                .all([count, load])
                .finally(
                    function onFinally() {
                        $scope.loaded = true;
                        $scope.loading = false;
                    }
                );
        }

    }
})();
