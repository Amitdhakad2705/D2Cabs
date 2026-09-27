/* D2Cabs API client. Loaded on every page BEFORE the page's own script.
   - Login is an httpOnly cookie set by the server, so every call uses credentials:'include'.
   - Base URL: window.__D2_API_BASE__ (set from VITE_API_BASE_URL) or '/api' (Vite proxy in dev). */
(function () {
  var BASE = String(window.__D2_API_BASE__ || '/api').replace(/\/+$/, '');

  function request(method, path, body) {
    var opts = { method: method, credentials: 'include', headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(BASE + path, opts).then(
      function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var err = new Error(data.message || 'Something went wrong. Please try again.');
            err.status = res.status;
            err.data = data;
            throw err;
          }
          return data;
        });
      },
      function () {
        var err = new Error('Cannot reach the server. Please check your internet and try again.');
        err.network = true;
        throw err;
      }
    );
  }

  window.D2Api = {
    base: BASE,
    get: function (p) { return request('GET', p); },
    post: function (p, b) { return request('POST', p, b === undefined ? {} : b); },
    put: function (p, b) { return request('PUT', p, b); },
    patch: function (p, b) { return request('PATCH', p, b); },
    del: function (p) { return request('DELETE', p); }
  };
})();
