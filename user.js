/* Acadaelash user store: saves the signed-in user.
   Loaded right after config.js, before the portal script, so the portal finds the saved user on start-up.
   If this file fails to load, the portal still works (it just stops remembering the user).

   User.save(acct, cred, keep)   call after a login or sign-up. Always writes the session (sessionStorage,
                                 the same 'acct' and 'cred' keys the portal already reads). With keep = true
                                 and a student account it also keeps a copy on this device for 7 days.
   User.signIn(sb, email, hash)  logs in with login_account and saves the user. Used right after sign-up so
                                 a new student does not have to type the password again.
   User.current()                the saved account object, or null.
   User.clear()                  wipes the session and the saved copy. Call on log out.

   Note: 'cred' holds the password hash the SQL functions check, so the 7-day copy is opt-in, students only. */
(function () {
  'use strict';
  var KEEP = 'acadaelash-user', DAYS = 7;

  function read(store, key) { try { return JSON.parse(store.getItem(key)); } catch (e) { return null; } }
  function write(store, key, val) { try { store.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  function drop(store, key) { try { store.removeItem(key); } catch (e) { /* storage blocked */ } }

  var User = {
    save: function (acct, cred, keep) {
      if (!acct || !cred) return false;
      write(sessionStorage, 'acct', acct);
      write(sessionStorage, 'cred', cred);
      if (keep && acct.role === 'student') write(localStorage, KEEP, {acct: acct, cred: cred, exp: Date.now() + DAYS * 864e5});
      else drop(localStorage, KEEP);   // a normal login replaces any older "keep me signed in" copy
      return true;
    },
    current: function () { return read(sessionStorage, 'acct'); },
    clear: function () {
      drop(sessionStorage, 'acct'); drop(sessionStorage, 'cred'); drop(localStorage, KEEP);
    },
    signIn: async function (sb, email, hash) {
      try {
        var r = await sb.rpc('login_account', {p_email: email, p_hash: hash});
        if (r.error || !r.data || !r.data.role) return null;   // no role = wrong password or locked
        User.save(r.data, {email: email, hash: hash}, false);
        return r.data;
      } catch (e) { return null; }
    }
  };

  /* New tab or browser restart: bring back a user who ticked "Keep me signed in" and has not expired. */
  if (!User.current()) {
    var s = read(localStorage, KEEP);
    if (s && s.acct && s.cred && s.exp > Date.now()) { write(sessionStorage, 'acct', s.acct); write(sessionStorage, 'cred', s.cred); }
    else if (s) drop(localStorage, KEEP);
  }
  window.User = User;
})();
