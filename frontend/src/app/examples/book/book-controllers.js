/**
 * This file contains all necessary Angular controller definitions for 'frontend.examples.book' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
    'use strict';

    // Controller for new book creation.
    angular.module('frontend.examples.book')
        .controller('BookAddController', [
            '$scope', '$state',
            'MessageService',
            'BookModel',
            '_authors',
            function controller(
                $scope, $state,
                MessageService,
                BookModel,
                _authors
            ) {
                // Store authors
                $scope.authors = _authors;

                // Initialize book model
                $scope.book = {
                    title: '',
                    description: '',
                    author: '',
                    releaseDate: new Date()
                };

                /**
                 * Scope function to store new book to database. After successfully save user will be redirected
                 * to view that new created book.
                 */
                $scope.addBook = function addBook() {
                    BookModel
                        .create(angular.copy($scope.book))
                        .then(
                            function onSuccess(result) {
                                MessageService.success('New book added successfully');

                                $state.go('examples.book', {
                                    id: result.data.id
                                });
                            }
                        );
                };
            }
        ]);

    // Controller to show single book on GUI.
    angular.module('frontend.examples.book')
        .controller('BookController', [
            '$scope', '$state',
            'UserService', 'MessageService',
            'BookModel', 'AuthorModel',
            '_book',
            function controller(
                $scope, $state,
                UserService, MessageService,
                BookModel, AuthorModel,
                _book
            ) {
                // Set current scope reference to model
                BookModel.setScope($scope, 'book');

                // Initialize scope data
                $scope.user = UserService.user();
                $scope.book = _book;
                $scope.authors = [];
                $scope.selectAuthor = _book.author ? _book.author.id : null;

                // Book delete dialog buttons configuration
                $scope.confirmButtonsDelete = {
                    ok: {
                        label: 'Delete',
                        className: 'btn-danger',
                        callback: function callback() {
                            $scope.deleteBook();
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        className: 'btn-default pull-left'
                    }
                };

                /**
                 * Scope function to save the modified book. This will send a
                 * socket request to the backend server with the modified object.
                 */
                $scope.saveBook = function saveBook() {
                    var data = angular.copy($scope.book);

                    // Set author id to update data
                    data.author = $scope.selectAuthor;

                    // Make actual data update
                    BookModel
                        .update(data.id, data)
                        .then(
                            function onSuccess() {
                                MessageService.success('Book "' + $scope.book.title + '" updated successfully');
                            }
                        );
                };

                /**
                 * Scope function to delete current book. This will send DELETE query to backend via web socket
                 * query and after successfully delete redirect user back to book list.
                 */
                $scope.deleteBook = function deleteBook() {
                    BookModel
                        .delete($scope.book.id)
                        .then(
                            function onSuccess() {
                                MessageService.success('Book "' + $scope.book.title + '" deleted successfully');

                                $state.go('examples.books');
                            }
                        );
                };

                /**
                 * Scope function to fetch author data when needed, this is triggered whenever user starts to edit
                 * current book.
                 *
                 * @returns {null|promise}
                 */
                $scope.loadAuthors = function loadAuthors() {
                    if ($scope.authors.length) {
                        return null;
                    } else {
                        return AuthorModel
                            .load()
                            .then(
                                function onSuccess(data) {
                                    $scope.authors = data;
                                }
                            );
                    }
                };
            }
        ]);

    // Controller which contains all necessary logic for book list GUI on boilerplate application.
    angular.module('frontend.examples.book')
        .controller('BookListController', [
            '$scope', '$q', '$timeout', '$state','$controller',
            '_',
            'ListConfig', 'SocketHelperService',
            'UserService', 'BookModel', 'AuthorModel', 'moment',
            '_items', '_count', '_authors',
            function controller(
                $scope, $q, $timeout, $state, $controller,
                _,
                ListConfig, SocketHelperService,
                UserService, BookModel, AuthorModel, moment,
                _items, _count, _authors
            ) {
                // Set current scope reference to models
                BookModel.setScope($scope, false, 'items', 'itemCount');
                AuthorModel.setScope($scope, false, 'authors');

                // Add default list configuration variable to current scope
                $scope = angular.extend($scope, angular.copy(ListConfig.getConfig()));

                // Set initial data
                $scope.items = _items;
                $scope.itemCount = _count.count;
                $scope.authors = _authors;
                $scope.user = UserService.user();
                $scope.$state = $state;
                $scope.Model = BookModel;

                // Initialize used title items
                $scope.titleItems = ListConfig.getTitleItems(BookModel.endpoint);

                $scope.getAuthor = function getAuthor(authorId, property, defaultValue) {
                    defaultValue = defaultValue || 'Unknown';
                    property = property || true;

                    // Find author
                    var author = _.find($scope.authors, function iterator(author) {
                        return parseInt(author.id, 10) === parseInt(authorId.toString(), 10);
                    });

                    return author ? (property === true ? author : author[property]) : defaultValue;
                };

                $scope.columnDefs = [{
                    headerName: 'Title',
                    field: 'title',
                    editable: true,
                    filter: 'text',
                    filterParams: {newRowsAction: 'keep'}
                }, {
                    headerName: 'Author',
                    field: 'author',
                    suppressMenu: true,
                    suppressSorting: true,
                    cellRenderer: function(params) {
                        var authorName = $scope.getAuthor(params.data.author, 'name');
                        var authorId = $scope.getAuthor(params.data.author, 'id');
                        var href = $scope.$state.href('examples.author', {
                            id: authorId
                        });
                        return '<a href="' + href + '">' + authorName + '</a>';
                    }
                }, {
                    headerName: 'Year',
                    filter: 'text',
                    filterParams: {newRowsAction: 'keep'},
                    field: 'releaseDate',
                    cellRenderer: function(params) {
                        return moment(params.data.releaseDate).format('YYYY');
                    }
                }];

                // inherit from Grid Controller
                $controller('GridController', {
                    $scope: $scope
                });
            }
        ]);
}());
