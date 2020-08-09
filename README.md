# Description

This project based on [dmansfield/passport-negotiate](https://github.com/dmansfield/passport-negotiate) repository,
consider its activity and outdated Kerberos dependency I have created a new repo composed with TypeScript.

Negotiate (Kerberos) single-sign-on authentication strategy for Passport.

This Passport strategy implements authentication of users implementing "HTTP Negotiate", or SPNEGO auth-scheme, as described in RFC-4559.

For this to work, clients (browsers) must have access to a "credentials cache", which happens when logging in to a Domain in Windows, or in Linux/Unix either by using the "kinit" tool directly, or by using PAM modules which do this at login time, for example using sssd with a kerberos DC or Active Directory Domain Controller such as Samba 4.
Adjust your browser settings in order to start Kerberos Negotiations with your backend server. A [helping article from cloudera in this topic](https://docs.cloudera.com/documentation/enterprise/latest/topics/cdh_sg_browser_access_kerberos_protected_url.html) can be useful.

When "Negotiate" is requested by the server, via a "WWW-Authenticate: Negotiate" header and a 401 response, the browser will obtain credentials in the form of a "ticket". The browser will then re-request the resource with the ticket data provided in the "Authorization: Negotiate .....". This happens transparently to the user.

Node.js can also be made to work as a negotiate enabled client, see this [Gist](https://gist.github.com/dmansfield/c75817dcacc2393da0a7).

# Install

> $ npm install --save passport-kerberos-negotiation kerberos

#### Configure Strategy

The kerberos authentication strategy authenticates users using a username and
password.  The strategy requires a `verify` callback, which accepts the user's
kerberos principal and calls `done` providing a user. Kerberos principals 
typically look like user@REALM.

```ts
import { KerberosNegotiationStrategy } from 'passport-kerberos-negotiation';

passport.use(new KerberosNegotiationStrategy(function(principal, done) {
    User.findOne({ principal: principal }, function (err, user) {
        return done(err, user);
    });
}));
```

There are some quirks worth noting:

1. You _must not_ use `failureRedirect` when using the authentication method 
as middleware, because the strategy must generate a 401 status response with 
a specific header (WWW-Authenticate: Negotiate), which won't happen if 
`failureRedirect` is used.
2. Kerberos authentication can succeed, but the supplied `verify` function 
cannot find a user object for the user.  In this case, a `noUserRedirect` can
be supplied which will in many respects work the way `failureRedirect` works
for other strategies.