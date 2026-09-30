/* D2Cabs login / signup / forgot-password popup, shared by every page.
   Talks to the backend (/api/auth/*). The real login lives in an httpOnly cookie;
   nothing secret (no password, no token) is ever stored in the browser. */
(function () {
  var overlay = document.getElementById('d2AuthOverlay');
  var authBtn = document.getElementById('authBtn');
  var accountMenu = document.getElementById('d2AccountMenu');
  if (!overlay || !authBtn || !window.D2Api) return;

  var currentUser = null;
  var listeners = [];

  function setUser(user) {
    currentUser = user || null;
    refreshHeader();
    listeners.forEach(function (cb) { try { cb(currentUser); } catch (e) { /* ignore */ } });
  }
  // function openModal(panel) {
  //   ['d2LoginPanel', 'd2SignupPanel', 'd2ForgotPanel'].forEach(function (id) {
  //     document.getElementById(id).hidden = true;
  //   });
  //   document.getElementById(panel).hidden = false;
  //   overlay.classList.add('open');
  // }
  // function closeModal() { overlay.classList.remove('open'); }
  function openModal(panel) {
   ['d2LoginPanel', 'd2SignupPanel', 'd2ForgotPanel'].forEach(function (id) {
    document.getElementById(id).hidden = true;
  });
    document.getElementById(panel).hidden = false;
    overlay.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
   overlay.classList.remove('open');
   document.documentElement.style.overflow = '';
   document.body.style.overflow = '';
  }

  function refreshHeader() {
    if (currentUser) {
      authBtn.textContent = (currentUser.name || 'A').trim().charAt(0).toUpperCase() || 'A';
      authBtn.classList.add('is-logged-in');
      authBtn.setAttribute('aria-label', 'Account menu');
    } else {
      authBtn.textContent = 'Login';
      authBtn.classList.remove('is-logged-in');
      authBtn.setAttribute('aria-label', 'Login or Sign up');
    }
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Please wait…'; }
    else if (btn.dataset.label) { btn.textContent = btn.dataset.label; }
  }

  authBtn.addEventListener('click', function () {
    if (currentUser) accountMenu.classList.toggle('open');
    else openModal('d2LoginPanel');
  });
  document.getElementById('d2AuthClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.getElementById('showSignup').addEventListener('click', function () { openModal('d2SignupPanel'); });
  document.getElementById('showLoginFromSignup').addEventListener('click', function () { openModal('d2LoginPanel'); });
  document.getElementById('showForgot').addEventListener('click', function () { openModal('d2ForgotPanel'); });
  document.getElementById('showLoginFromForgot').addEventListener('click', function () { openModal('d2LoginPanel'); });

  // password show/hide eye icon
  var EYE_OPEN = '<path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"></path><circle cx="12" cy="12" r="3"></circle>';
  var EYE_CLOSED = '<path d="M2 2l20 20"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10.5 8 10.5 8a18.5 18.5 0 0 1-2.16 3.19m-3.35 2.98A9.12 9.12 0 0 1 12 20c-7 0-10.5-8-10.5-8a18.5 18.5 0 0 1 4.22-5.94"></path>';
  document.querySelectorAll('.d2-pass-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var inp = document.getElementById(btn.getAttribute('data-target'));
      var icon = btn.querySelector('svg');
      if (inp.type === 'password') { inp.type = 'text'; icon.innerHTML = EYE_CLOSED; }
      else { inp.type = 'password'; icon.innerHTML = EYE_OPEN; }
    });
  });

  /* ---------------- Sign up ---------------- */
  var signupBtn = document.getElementById('signupSubmitBtn');
  signupBtn.addEventListener('click', function () {
    var name = document.getElementById('signupName').value.trim();
    var phone = document.getElementById('signupPhone').value.trim();
    var email = document.getElementById('signupEmail').value.trim();
    var pass = document.getElementById('signupPassword').value;
    var err = document.getElementById('signupError');
    err.textContent = '';
    if (!name || !email || !phone || !pass) { err.textContent = 'Please fill name, email, mobile number and password.'; return; }
    if (!/^\d{10}$/.test(phone)) { err.textContent = 'Enter a valid 10-digit mobile number.'; return; }
    if (pass.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
    busy(signupBtn, true, 'Creating account…');
    D2Api.post('/auth/register', { name: name, phone: phone, email: email, password: pass })
      .then(function (r) { setUser(r.user); closeModal(); })
      .catch(function (e) { err.textContent = e.message; })
      .then(function () { busy(signupBtn, false); });
  });

  /* ---------------- Login (mobile number OR email) ---------------- */
  var loginBtn = document.getElementById('loginSubmitBtn');
  loginBtn.addEventListener('click', function () {
    var idVal = document.getElementById('loginIdentifier').value.trim();
    var pass = document.getElementById('loginPassword').value;
    var err = document.getElementById('loginError');
    err.textContent = '';
    if (!idVal || !pass) { err.textContent = 'Please fill in all fields.'; return; }
    busy(loginBtn, true, 'Logging in…');
    D2Api.post('/auth/login', { identifier: idVal, password: pass })
      .then(function (r) { document.getElementById('loginPassword').value = ''; setUser(r.user); closeModal(); })
      .catch(function (e) { err.textContent = e.message; })
      .then(function () { busy(loginBtn, false); });
  });

  /* ---------------- Forgot password (OTP is emailed) ---------------- */
  var otpStage = false;
  var forgotBtn = document.getElementById('forgotSubmitBtn');
  forgotBtn.addEventListener('click', function () {
    var idVal = document.getElementById('forgotPhone').value.trim();
    var err = document.getElementById('forgotError');
    var hint = document.getElementById('forgotHint');
    err.textContent = '';
    if (!idVal) { err.textContent = 'Please enter your mobile number or email.'; return; }

    if (!otpStage) {
      busy(forgotBtn, true, 'Sending…');
      D2Api.post('/auth/forgot-password', { identifier: idVal })
        .then(function (r) {
          otpStage = true;
          document.getElementById('forgotOtpGroup').hidden = false;
          document.getElementById('forgotNewPassGroup').hidden = false;
          forgotBtn.dataset.label = 'Reset Password';
          document.getElementById('forgotSub').textContent = 'Enter the 6-digit OTP sent to your registered email';
          hint.textContent = r.message || '';
        })
        .catch(function (e) { err.textContent = e.message; })
        .then(function () { busy(forgotBtn, false); });
      return;
    }

    var otp = document.getElementById('forgotOtp').value.trim();
    var newPass = document.getElementById('forgotNewPassword').value;
    if (!/^\d{6}$/.test(otp)) { err.textContent = 'Enter the 6-digit OTP.'; return; }
    if (newPass.length < 8) { err.textContent = 'New password must be at least 8 characters.'; return; }
    busy(forgotBtn, true, 'Resetting…');
    D2Api.post('/auth/reset-password', { identifier: idVal, otp: otp, newPassword: newPass })
      .then(function () {
        otpStage = false;
        document.getElementById('forgotOtpGroup').hidden = true;
        document.getElementById('forgotNewPassGroup').hidden = true;
        document.getElementById('forgotOtp').value = '';
        document.getElementById('forgotNewPassword').value = '';
        forgotBtn.dataset.label = 'Send OTP';
        document.getElementById('forgotSub').textContent = 'Enter your registered mobile number or email';
        hint.textContent = '';
        openModal('d2LoginPanel');
        document.getElementById('loginError').textContent = 'Password changed. Please log in.';
      })
      .catch(function (e) { err.textContent = e.message; })
      .then(function () { busy(forgotBtn, false); });
  });

  /* ---------------- Logout ---------------- */
  document.getElementById('d2LogoutBtn').addEventListener('click', function () {
    D2Api.post('/auth/logout').catch(function () {}).then(function () {
      accountMenu.classList.remove('open');
      setUser(null);
    });
  });
  document.addEventListener('click', function (e) {
    if (!accountMenu.contains(e.target) && e.target !== authBtn) accountMenu.classList.remove('open');
  });

  document.querySelectorAll('.d2-social-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var note = btn.closest('.d2-auth-panel').querySelector('.d2-social-note');
      if (note) note.textContent = btn.getAttribute('data-provider') + ' login is not available yet. Please use mobile number or email.';
    });
  });

  /* ---------------- Public helper for the booking / payment code ---------------- */
  var readyPromise = D2Api.get('/auth/me')
    .then(function (r) { setUser(r.user); })
    .catch(function () { setUser(null); });

  window.D2Auth = {
    ready: readyPromise,
    getUser: function () { return currentUser; },
    openLogin: function () { openModal('d2LoginPanel'); },
    onChange: function (cb) { listeners.push(cb); }
  };
  refreshHeader();
})();
