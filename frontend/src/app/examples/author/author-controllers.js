/**
 * This file contains all necessary Angular controller definitions for 'frontend.examples.author' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
    'use strict';

    // Controller for new author creation.
    angular.module('frontend.examples.author')
        .controller('AuthorAddController', [
            '$scope', '$state',
            'MessageService', 'AuthorModel',
            function controller(
                $scope, $state,
                MessageService, AuthorModel
            ) {
                // Initialize author model
                $scope.author = {
                    name: '',
                    description: ''
                };

                /**
                 * Scope function to store new author to database. After successfully save user will be redirected
                 * to view that new created author.
                 */
                $scope.addAuthor = function addAuthor() {
                    AuthorModel
                        .create(angular.copy($scope.author))
                        .then(
                            function onSuccess(result) {
                                MessageService.success('New author added successfully');

                                $state.go('examples.author', {
                                    id: result.data.id
                                });
                            }
                        );
                };
            }
        ]);

    // Controller to show single author on GUI.
    angular.module('frontend.examples.author')
        .controller('AuthorController', [
            '$scope', '$state',
            'UserService', 'MessageService',
            'AuthorModel', 'BookModel',
            '_author', '_books', '_booksCount',
            function controller(
                $scope, $state,
                UserService, MessageService,
                AuthorModel, BookModel,
                _author, _books, _booksCount
            ) {
                // Set current scope reference to models
                AuthorModel.setScope($scope, 'author');
                BookModel.setScope($scope, false, 'books', 'booksCount');

                // Expose necessary data
                $scope.user = UserService.user();
                $scope.author = _author;
                $scope.books = _books;
                $scope.booksCount = _booksCount.count;

                // Author delete dialog buttons configuration
                $scope.confirmButtonsDelete = {
                    ok: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function callback() {
                            $scope.deleteAuthor();
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-default pull-left'
                    }
                };

                // Scope function to save modified author.
                $scope.saveAuthor = function saveAuthor() {
                    var data = angular.copy($scope.author);

                    // Make actual data update
                    AuthorModel
                        .update(data.id, data)
                        .then(
                            function onSuccess() {
                                MessageService.success('Author "' + $scope.author.name + '" updated successfully');
                            }
                        );
                };

                // Scope function to delete author
                $scope.deleteAuthor = function deleteAuthor() {
                    AuthorModel
                        .delete($scope.author.id)
                        .then(
                            function onSuccess() {
                                MessageService.success('Author "' + $scope.author.name + '" deleted successfully');

                                $state.go('examples.authors');
                            }
                        );
                };
            }
        ]);

    // Controller which contains all necessary logic for author list GUI on boilerplate application.
    angular.module('frontend.examples.author')
        .controller('AuthorListController', [
            '$scope', '$q', '$timeout', '$controller', '$state',
            '_',
            'ListConfig',
            'SocketHelperService', 'UserService', 'AuthorModel',
            '_items', '_count',
            function controller(
                $scope, $q, $timeout, $controller, $state,
                _,
                ListConfig,
                SocketHelperService, UserService, AuthorModel,
                _items, _count
            ) {
                // Set current scope reference to model
                AuthorModel.setScope($scope, false, 'items', 'itemCount');

                // Add default list configuration variable to current scope
                $scope = angular.extend($scope, angular.copy(ListConfig.getConfig()));

                // Set initial data
                $scope.items = _items;
                console.log($scope.items);
                $scope.itemCount = _count.count;
                $scope.user = UserService.user();
                $scope.populate = 'books';
                $scope.Model = AuthorModel;
                $scope.$state = $state;

                // Initialize used title items
                $scope.titleItems = ListConfig.getTitleItems(AuthorModel.endpoint);

                $scope.columnDefs = [{
                    headerName: 'Name',
                    field: 'name',
                    filter: 'text',
                    editable: true,
                    filterParams: {newRowsAction: 'keep'},
                    cellRenderer: function(params) {
                        var href = $scope.$state.href('examples.author', {
                            id: params.data.id
                        });
                        return '<a href="' + href + '">' + params.data.name + '</a>';
                    }

                }, {
                    headerName: 'Count',
                    suppressSorting:true,
                    field: 'count',
                    suppressMenu:true,
                    cellRenderer: function(params) {
                        return params.data.books.length;
                    }
                }];

                // inherit from Grid Controller
                $controller('GridController', {
                    $scope: $scope
                });

            }
        ]);
}());
