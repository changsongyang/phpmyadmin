import $ from 'jquery';
import { Functions } from '../functions.js';
import { CommonActions, CommonParams } from '../common.js';

/* global Navigation */

/**
 * @fileoverview    function used in server privilege pages
 * @name            Database Operations
 *
 * @requires    jQueryUI
 */

/**
 * Ajax event handlers here for /database/operations
 *
 * Actions Ajaxified here:
 * Rename Database
 * Copy Database
 * Change Charset
 * Drop Database
 */

/**
 * Unbind all event handlers before tearing down a page
 */
window.AJAX.registerTeardown('database/operations.js', function () {
    $(document).off('submit', '#rename_db_form.ajax');
    $(document).off('submit', '#copy_db_form.ajax');
    $(document).off('submit', '#change_db_charset_form.ajax');
    $(document).off('click', '#drop_db_anchor.ajax');
});

window.AJAX.registerOnload('database/operations.js', function () {
    /**
     * Ajax event handlers for 'Rename Database'
     */
    $(document).on('submit', '#rename_db_form.ajax', function (event) {
        event.preventDefault();

        if (Functions.emptyCheckTheField(this, 'newname')) {
            Functions.ajaxShowMessage(window.Messages.strFormEmpty, false, 'error');
            return false;
        }

        var oldDbName = CommonParams.get('db');
        var newDbName = $('#new_db_name').val();

        if (newDbName === oldDbName) {
            Functions.ajaxShowMessage(window.Messages.strDatabaseRenameToSameName, false, 'error');
            return false;
        }

        var $form = $(this);

        var question = Functions.escapeHtml('CREATE DATABASE ' + newDbName + ' / DROP DATABASE ' + oldDbName);

        Functions.prepareForAjaxRequest($form);

        $form.confirm(question, $form.attr('action'), function (url) {
            Functions.ajaxShowMessage(window.Messages.strRenamingDatabases, false);
            $.post(url, $('#rename_db_form').serialize() + CommonParams.get('arg_separator') + 'is_js_confirmed=1', function (data) {
                if (typeof data !== 'undefined' && data.success === true) {
                    Functions.ajaxShowMessage(data.message);
                    CommonParams.set('db', data.newname);

                    Navigation.reload(function () {
                        $('#pma_navigation_tree')
                            .find('a:not(\'.expander\')')
                            .each(function () {
                                var $thisAnchor = $(this);
                                if ($thisAnchor.text() === data.newname) {
                                    // simulate a click on the new db name
                                    // in navigation
                                    $thisAnchor.trigger('click');
                                }
                            });
                    });
                } else {
                    Functions.ajaxShowMessage(data.error, false);
                }
            }); // end $.post()
        });
    }); // end Rename Database

    /**
     * Ajax Event Handler for 'Copy Database'
     */
    $(document).on('submit', '#copy_db_form.ajax', function (event) {
        event.preventDefault();

        if (Functions.emptyCheckTheField(this, 'newname')) {
            Functions.ajaxShowMessage(window.Messages.strFormEmpty, false, 'error');
            return false;
        }

        Functions.ajaxShowMessage(window.Messages.strCopyingDatabase, false);
        var $form = $(this);
        Functions.prepareForAjaxRequest($form);
        $.post($form.attr('action'), $form.serialize(), function (data) {
            // use messages that stay on screen
            $('.alert-success, .alert-danger').fadeOut();
            if (typeof data !== 'undefined' && data.success === true) {
                if ($('#checkbox_switch').is(':checked')) {
                    CommonParams.set('db', data.newname);
                    CommonActions.refreshMain(false, function () {
                        Functions.ajaxShowMessage(data.message);
                    });
                } else {
                    CommonParams.set('db', data.db);
                    Functions.ajaxShowMessage(data.message);
                }
                Navigation.reload();
            } else {
                Functions.ajaxShowMessage(data.error, false);
            }
        }); // end $.post()
    }); // end copy database

    /**
     * Change tables columns visible only if change tables is checked
     */
    $('#span_change_all_tables_columns_collations').hide();
    $('#checkbox_change_all_tables_collations').on('click', function () {
        $('#span_change_all_tables_columns_collations').toggle();
    });

    /**
     * Ajax Event handler for 'Change Charset' of the database
     */
    $(document).on('submit', '#change_db_charset_form.ajax', function (event) {
        event.preventDefault();
        var $form = $(this);
        Functions.prepareForAjaxRequest($form);
        Functions.ajaxShowMessage(window.Messages.strChangingCharset);
        $.post($form.attr('action'), $form.serialize(), function (data) {
            if (typeof data !== 'undefined' && data.success === true) {
                Functions.ajaxShowMessage(data.message);
            } else {
                Functions.ajaxShowMessage(data.error, false);
            }
        }); // end $.post()
    }); // end change charset

    /**
     * Ajax event handlers for Drop Database
     */
    $(document).on('click', '#drop_db_anchor.ajax', function (event) {
        event.preventDefault();
        var $link = $(this);
        /**
         * @var {String} question String containing the question to be asked for confirmation
         */
        var question = window.Messages.strDropDatabaseStrongWarning + ' ';
        question += Functions.sprintf(
            window.Messages.strDoYouReally,
            'DROP DATABASE `' + Functions.escapeHtml(CommonParams.get('db') + '`')
        );
        var params = Functions.getJsConfirmCommonParam(this, $link.getPostData());

        $(this).confirm(question, $(this).attr('href'), function (url) {
            Functions.ajaxShowMessage(window.Messages.strProcessingRequest);
            $.post(url, params, function (data) {
                if (typeof data !== 'undefined' && data.success) {
                    // Database deleted successfully, refresh both the frames
                    Navigation.reload();
                    CommonParams.set('db', '');
                    CommonActions.refreshMain(
                        'index.php?route=/server/databases',
                        function () {
                            Functions.ajaxShowMessage(data.message);
                        }
                    );
                } else {
                    Functions.ajaxShowMessage(data.error, false);
                }
            });
        });
    });
});
