(function () {
  var navToggle = document.querySelector('.nav-toggle');
  var siteNav = document.getElementById('site-nav');
  var tabletBreakpoint = window.matchMedia('(max-width: 960px)');

  function closeSiteNav() {
    if (!navToggle || !siteNav) {
      return;
    }
    navToggle.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open', !expanded);
      document.body.classList.toggle('nav-open', !expanded);
    });

    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeSiteNav);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeSiteNav();
    }
  });

  document.addEventListener('click', function (event) {
    if (!tabletBreakpoint.matches) {
      return;
    }
    var target = event.target;
    if (
      siteNav &&
      siteNav.classList.contains('is-open') &&
      !siteNav.contains(target) &&
      navToggle &&
      !navToggle.contains(target)
    ) {
      closeSiteNav();
    }
  });

  tabletBreakpoint.addEventListener('change', function (event) {
    if (!event.matches) {
      closeSiteNav();
    }
  });
})();
