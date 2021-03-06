.. reviewed 0.4
.. include:: /replace.rst

Session preparation and join
----------------------------

A web application creates one :class:`SessionInterface` instance per browser document frame to control authentication, session preparation, session joining, and session exiting operations against a coweb server. The application receives callbacks from the :class:`SessionInterface` as these operations progress, succeed, or fail.

The use of the session API has the following requirements:

#. If the application needs a custom :data:`cowebConfig`, the configuration must be defined before before loading any coweb module.
#. The application must use an `AMD`_ loader to import the the `coweb/main` module.

Initializing the session singleton
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. function:: coweb.initSession()

   A web application or its runtime environment calls this method to get a reference to a :class:`SessionInterface` singleton. The :data:`cowebConfig` dictates the implementation of the :class:`SessionInterface` used and its configuration. Repeat calls to this method return the same singleton instance.
   
   :returns: :class:`SessionInterface`

Using the session instance
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. class:: SessionInterface()

   Singleton encapsulating the session APIs for web application use. A web application should use the :func:`coweb.initSession` factory function instead of instantiating this object directly.

.. function:: SessionInterface.getLastPrepare()

   A web application calls this method to get the last arguments passed to :func:`SessionInterface.prepare`. The arguments include any values inferred by the framework such as defaults.

   :returns: object

.. function:: SessionInterface.join()

      A web application calls this method to join a session after receiving a callback from :func:`SessionInterface.prepare`. If the application invoked :func:`SessionInterface.prepare` with `autoJoin` set to true, the framework automatically invokes this method upon the prepare callback.

   :throws Error: If invoked before preparing the session or after joining a session
   :returns: :class:`Promise`
   :callback: Invoked after successful join if the `autoUpdate` flag to :func:`SessionInterface.prepare` was false. Otherwise, invoked after the update completes. Receives an object with the same properties documented for :func:`SessionInterface.prepare`.
   :errback: Invoked on failed preparation with a string error tag of `not-allowed` if the user needs to authenticate, `session-unavailable` if the session ended before joining, or `server-unavailable`

.. function:: SessionInterface.login(username, password)
   
   A web application calls this method to send a username and password to the configured login URL on the coweb server. This method is for application convenience. The application can choose to authenticate with the coweb server in any other server-supported manner.
   
   :param string username: Username to authenticate
   :param string password: Password for the user
   :throws Error: If invoked after starting the prepare-join-update procedure
   :returns: :class:`Promise`
   :callback: Invoked on successful login
   :errback: Invoked on failed login

.. function:: SessionInterface.leave()

   A web application calls this method to leave a session while or after entering it.

   :returns: :class:`Promise`
   :callback: Invoked on successful exit
   :errback: Invoked on failed exit

.. function:: SessionInterface.logout()

   A web application calls this method to contact the configured logout URL on the coweb server. This method is for application convenience. The application can choose to remove authentication credentials in any other server-supported manner.

   :returns: :class:`Promise`
   :callback: Invoked on successful logout
   :errback: Invoked on failed logout

.. function:: SessionInterface.onStatusChange(status)

   A :class:`SessionInterface` invokes this method when its session status changes. A web application can override or hook (e.g., `dojo.connect`) this method to advise the user of the change in session status (e.g., show a modal busy dialog while joining to prevent user interaction before cooperation is possible).
   
   A web application should not take programmatic action based on these notices: their sequencing with respect to the internal state of :class:`SessionInterface` is not well-defined. For example, an application should not watch for `joining` in order to invoke :func:`SessionInterface.update`. Instead, the application should use the :class:`Promise` returned by :func:`SessionInterface.join`.

   :param string topic: One of the following status strings

      preparing
         Now preparing the session
      joining
         Now joining the session
      updating
         Now updating the local application state in the session
      ready
         Now ready for cooperative interaction in the session
      aborting
         Now aborting the prepare, join, and update process
      stream-error
         Now disconnected from the session because of a server or communication error
      server-unavailable
         Now disconnected from the session because the server is unreachable
      server-unavailable
         Now disconnected from the session because the session is unreachable
      bad-application-state
         Now disconnected from the session because the local application raised an error during the update phase
      clean-disconnect
         Now disconnected from the session because of an expected disconnect

.. function:: SessionInterface.prepare([args])
   
   A web application calls this method to request access to a session before attempting to join it.
   
   All parameters to this function are optional. When given, they are passed as name/value properties on a single `args` object.

   :param string key: Key uniquely identifying the session to join. If undefined, tries to read the argument `cowebkey` from the page URL to use instead. If the argument is undefined, uses the (domain, port, path, arguments) tuple of the current page as the key. 
   :param boolean collab: True to request a session supporting cooperative events, false to request a session supporting service bot messages only. Defaults to `true`.
   :param boolean autoJoin: True to automatically join a session after successfully preparing it, false to require an explicit application call to :func:`SessionInterface.join`. Defaults to `true`.
   :param boolean autoUpdate: True to automatically update application state in a session after successfully joining it, false to require an explicit application call to :func:`SessionInterface.updateInSession`. Defaults to `true`.
   :throws Error: If invoked after preparing a session
   :returns: :class:`Promise`
   :callback: Invoked after successful preparation if `autoJoin` is false. Otherwise, invoked after the last auto action completes. Receives an object with the following properties:

      collab (boolean)
         If the server created a collaborative session or not. May or may not match what was requested.
      key (string)
         Session key passed to :func:`SessionInterface.prepare` or determined from the page URL
      info (object)
         Arbitrary name/value pairs included by a coweb server extension point
      username (string)
         Name of the authenticated user
      sessionurl (string)
         URL :class:`SessionInterface.join` will contact to join the session
      sessionid (string)
         Unique session identifier assigned by the coweb server
      phase (string)
         One of `prepare`, `join`, or `update` indicating which action resolved the promise

   :errback: Invoked on failed preparation with a string error tag of `not-allowed` if the user needs to authenticate or `server-unavailable`

.. function:: SessionInterface.update()

   A web application calls this method to update its local state after receiving a callback from :func:`SessionInterface.join`. If the application invoked :func:`SessionInterface.prepare` with `autoUpdate` set to true, the framework automatically invokes this method upon the join callback.

   :throws Error: If invoked before joining a session or after updating in a session
   :returns: :class:`Promise`
   :callback: Invoked after successful update. Receives an object with the same properties documented for :func:`SessionInterface.prepare`.
   :errback: Invoked on failed preparation with a string error tag of `bad-application-state` if the update fails.

.. _session-use-cases:

Use cases
~~~~~~~~~

The following code snippets demonstrate some common uses of the session API.

Application attempts to enter a session
#######################################

Assume an application wants to enter a session without delay.

.. sourcecode:: javascript

   // get session interface
   var sess = coweb.initSession();
   // use defaults, collaborative session, join and update automatically
   sess.prepare().then(function(info) {
      // invoked after prepare, join, and update complete
   }, function(err) {
      // invoked on any error during the sequence
   });

Application acts on session info before joining
###############################################

Imagine an application wants to configure its UI based on the session information returned in the response to the prepare request before joining the session.

.. sourcecode:: javascript

   // get session interface
   var sess = coweb.initSession();
   // use defaults to prepare
   sess.prepare({autoJoin : false}).then(function(info) {
      // invoked after prepare completes
      // app can do work here (e.g., shows session info in its UI)
      // then app can continue with join
      return sess.join();
   }, function(err) {
      // invoked on any error during prepare
   }).then(function() {
      // invoked after join and update complete
   }, function(err) {
      // invoked on any error during join or update
   });

Application does its own authentication
#######################################

Say an application wants to collection credentials from a user before attempting to prepare the session.

.. sourcecode:: javascript

   // get session interface
   var sess = coweb.initSession();
   // assume username / password vars contain info collected via a form or 
   // some other means
   sess.login(username, password).then(function() {
      // invoke session prepare now; callback/errback omitted
      sess.prepare();
   }, function(err) {
      // auth failed, prompt again
   });

.. seealso::

   :doc:`/tutorial/shopping`
      Tutorial detailing the use of the session API to create a cooperative shopping list.