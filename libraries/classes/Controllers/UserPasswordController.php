<?php

declare(strict_types=1);

namespace PhpMyAdmin\Controllers;

use PhpMyAdmin\DatabaseInterface;
use PhpMyAdmin\Display\ChangePassword;
use PhpMyAdmin\Html\Generator;
use PhpMyAdmin\Message;
use PhpMyAdmin\Response;
use PhpMyAdmin\Template;
use PhpMyAdmin\UserPassword;

/**
 * Displays and handles the form where the user can change their password.
 */
class UserPasswordController extends AbstractController
{
    /** @var UserPassword */
    private $userPassword;

    /**
     * @param Response          $response     Response object
     * @param DatabaseInterface $dbi          DatabaseInterface object
     * @param Template          $template     Template that should be used
     * @param UserPassword      $userPassword UserPassword object
     */
    public function __construct($response, $dbi, Template $template, UserPassword $userPassword)
    {
        parent::__construct($response, $dbi, $template);
        $this->userPassword = $userPassword;
    }

    public function index(): void
    {
        global $cfg, $hostname, $username, $password, $change_password_message, $msg;

        $this->addScriptFiles(['server/privileges.js', 'vendor/zxcvbn.js']);

        /**
         * Displays an error message and exits if the user isn't allowed to use this
         * script
         */
        if (! $cfg['ShowChgPassword']) {
            $cfg['ShowChgPassword'] = $this->dbi->selectDb('mysql');
        }
        if ($cfg['Server']['auth_type'] === 'config' || ! $cfg['ShowChgPassword']) {
            $this->response->addHTML(Message::error(
                __('You don\'t have sufficient privileges to be here right now!')
            )->getDisplay());

            return;
        }

        /**
         * If the "change password" form has been submitted, checks for valid values
         * and submit the query or logout
         */
        if (isset($_POST['nopass'])) {
            if ($_POST['nopass'] == '1') {
                $password = '';
            } else {
                $password = $_POST['pma_pw'];
            }
            $change_password_message = $this->userPassword->setChangePasswordMsg();
            $msg = $change_password_message['msg'];

            if (! $change_password_message['error']) {
                $sql_query = $this->userPassword->changePassword($password);

                if ($this->response->isAjax()) {
                    $sql_query = Generator::getMessage($change_password_message['msg'], $sql_query, 'success');
                    $this->response->addJSON('message', $sql_query);

                    return;
                }

                $this->response->addHTML('<h1>' . __('Change password') . '</h1>' . "\n\n");
                $this->response->addHTML(Generator::getMessage($msg, $sql_query, 'success'));
                $this->render('user_password');

                return;
            }

            if ($this->response->isAjax()) {
                $this->response->addJSON('message', $change_password_message['msg']);
                $this->response->setRequestStatus(false);

                return;
            }
        }

        /**
         * If the "change password" form hasn't been submitted or the values submitted
         * aren't valid -> displays the form
         */

        // Displays an error message if required
        if (isset($msg)) {
            $this->response->addHTML($msg->getDisplay());
        }

        $this->response->addHTML(ChangePassword::getHtml('change_pw', $username, $hostname));
    }
}
