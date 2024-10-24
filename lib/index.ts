/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { initializeServer } from 'kerberos';
import { Strategy as NativePassportStrategy } from 'passport-strategy';

interface StrategyOptions {
  /**
   * A string containing the service principal in the form 'type@fqdn' (e.g. 'imap@mail.apple.com').
   */
  servicePrincipalName?: string;
  passReqToCallback?: boolean;
  noUserRedirectUrl?: string;
  verbose?: boolean;
}

export class KerberosNegotiationStrategy extends NativePassportStrategy {
  public name: string;
  private _verify: (...args: unknown[]) => void;
  private _servicePrincipalName: string;
  private _passReqToCallback: boolean;
  private _noUserRedirectUrl: string;
  private _verbose: boolean;

  public constructor(options: StrategyOptions, verify: (...args: unknown[]) => void) {
    super();
    if (typeof options === 'function') {
      verify = options;
      options = {};
    }
    this.name = 'krb5-negotiate';
    this._verify = verify;
    this._servicePrincipalName = options.servicePrincipalName;
    this._passReqToCallback = options.passReqToCallback;
    this._noUserRedirectUrl = options.noUserRedirectUrl;
    this._verbose = options.verbose;
  }

  public async authenticate(req: { get: Function, user?: unknown }, options: { session: boolean; property: string }): Promise<void> {
    if (this._verbose) console.log('Start Kerberos Authentication process... Given authenticate options', options);
    let auth = req.get('authorization');
    if (!auth) {
      if (this._verbose)
        console.log(
          'Throw error to start Kerberos SSO Negotiation. Has to be handled outside of the passport strategy, ' +
            'catch 401 error with "Negotiate" info to generate 401 status response with "WWW-Authenticate: Negotiate" header.'
        );
      return this.fail('Negotiate', 401);
    }

    if (auth.lastIndexOf('Negotiate ', 0) !== 0) {
      this.error(new Error('Malformed authentication token: ' + auth));
      return;
    }

    auth = auth.substring('Negotiate '.length);

    if (this._verbose) {
      console.log('Got Authorization header from the Request, Communication starts with the Kerberos server', options);
    }

    return new Promise<void>((resolve, reject) => {
      initializeServer(this._servicePrincipalName || 'HTTP', (err, context) => {
        if (err) {
          reject(err);
        }
        context.step(auth, err => {
          if (err) {
            reject(err);
          }

          const verified = (err: Error, user: unknown, info: unknown) => {
            if (err) {
              return this.error(err);
            }
            if (!user) {
              if (this._noUserRedirectUrl) {
                return this.redirect(this._noUserRedirectUrl);
              }
              return this.fail('No user found in the Kerberos database', 404);
            }
            return this.success(user, info);
          };

          const principal = context.username as string;
          if (this._verbose) console.log('Principal authenticated', principal);
          // if (req['session']) req['session']['authenticatedPrincipal'] = principal;
          // req['authenticatedPrincipal'] = principal;
          req.user = principal;

          if (this._verify) {
            if (this._passReqToCallback) {
              void this._verify(req, principal, verified);
            } else {
              void this._verify(principal, verified);
            }
          }
          resolve();
        });
      });
    });
  }
}
