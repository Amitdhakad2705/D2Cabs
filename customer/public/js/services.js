// FAQ accordion: the browser handles the clicked item's toggle; when one opens, close every other item.
document.addEventListener('DOMContentLoaded',function(){
  const faqItems=[...document.querySelectorAll('.d2-faq details')];
  faqItems.forEach(function(item){
    item.addEventListener('toggle',function(){
      if(!item.open) return;
      faqItems.forEach(function(other){
        if(other!==item) other.open=false;
      });
    });
  });
});

/* ---- next script block ---- */

document.getElementById('askQuestionForm')?.addEventListener('submit',function(e){e.preventDefault();const name=document.getElementById('askQuestionName').value.trim();const phone=document.getElementById('askQuestionPhone').value.trim();const email=document.getElementById('askQuestionEmail').value.trim();const q=document.getElementById('askQuestionInput').value.trim();if(!name||!phone||!q)return;const msg='*New Customer Question*\n\nName: '+name+'\nMobile: '+phone+(email?'\nEmail: '+email:'')+'\nQuestion: '+q;window.location.href='https://wa.me/918889633535?text='+encodeURIComponent(msg);});

/* ---- next script block ---- */

// Robust single-open accordion: opening one FAQ always closes every other FAQ.
document.addEventListener('click',function(e){
  const summary=e.target.closest('.d2-faq details > summary');
  if(!summary) return;
  const current=summary.parentElement;
  requestAnimationFrame(function(){
    if(!current.open) return;
    document.querySelectorAll('.d2-faq details[open]').forEach(function(other){
      if(other!==current) other.open=false;
    });
  });
});

/* ---- next script block ---- */

function d2FaqFilter(filter){
  var buttons=document.querySelectorAll('.faq-category-strip .faq-cat');
  var items=document.querySelectorAll('.d2-faq details[data-cat]');
  buttons.forEach(function(btn){
    var active=btn.getAttribute('data-filter')===filter;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
  });
  items.forEach(function(item){
    var show=item.getAttribute('data-cat')===filter;
    item.hidden=!show;
    item.classList.toggle('faq-hidden',!show);
    item.style.setProperty('display',show?'block':'none','important');
    if(!show) item.open=false;
  });
}
document.addEventListener('DOMContentLoaded',function(){d2FaqFilter('booking');});

/* ---- next script block ---- */

(function(){
  function filterFaq(category){
    var buttons=document.querySelectorAll('.faq-cat');
    var items=document.querySelectorAll('.d2-faq details');
    for(var i=0;i<buttons.length;i++){
      var b=buttons[i], active=b.getAttribute('data-filter')===category;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active?'true':'false');
    }
    for(var j=0;j<items.length;j++){
      var item=items[j], show=item.getAttribute('data-cat')===category;
      item.hidden=!show;
      item.style.setProperty('display', show?'block':'none', 'important');
      if(!show) item.removeAttribute('open');
    }
  }
  window.d2FaqFilter=filterFaq;
  function init(){ filterFaq('booking'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

/* ---- next script block ---- */

(function(){
  function initMenu(){
    var btn = document.querySelector('.faq-header-menu');
    var nav = document.querySelector('.faq-header-nav');
    if(!btn || !nav) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = nav.classList.toggle('d2-menu-open');
      nav.hidden = !isOpen;
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){
      if(nav.classList.contains('d2-menu-open') && !nav.contains(e.target) && e.target !== btn){
        nav.classList.remove('d2-menu-open');
        nav.hidden = true;
        btn.setAttribute('aria-expanded','false');
      }
    });
    nav.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){
        nav.classList.remove('d2-menu-open');
        nav.hidden = true;
        btn.setAttribute('aria-expanded','false');
      }
    });
  }
  function initHeaderOffset(){
    var header = document.querySelector('.faq-header');
    var wrap = document.querySelector('.faq-page');
    if(!header || !wrap) return;
    function apply(){
      wrap.style.paddingTop = header.offsetHeight + 'px';
    }
    apply();
    window.addEventListener('resize', apply);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ initMenu(); initHeaderOffset(); });
  } else {
    initMenu();
    initHeaderOffset();
  }
})();

/* ---- next script block ---- */

(function(){
  var header=document.querySelector('.faq-header');
  if(!header) return;
  var lastY=window.scrollY||window.pageYOffset||0;
  var ticking=false;
  function onScroll(){
    var y=window.scrollY||window.pageYOffset||0;
    if(y>lastY && y>80){
      header.classList.add('d2-header-hidden');
    }else if(y<lastY){
      header.classList.remove('d2-header-hidden');
    }
    lastY=y<0?0:y;
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){
      window.requestAnimationFrame(onScroll);
      ticking=true;
    }
  },{passive:true});
})();

/* ---- next script block ---- */

/* Login / signup / forgot-password now lives in /js/d2auth.js (talks to the backend API). */

/* ---- next script block ---- */

/* Homepage-style testimonial carousel for Services page */
(function(){
  function initTestimonials(){
    var root=document.getElementById('d2Homepage');
    if(!root || root.dataset.testimonialsReady==='1') return;
    var viewport=root.querySelector('.d2-flow-viewport');
    var cards=Array.from(root.querySelectorAll('.d2-flow-card'));
    var dots=Array.from(root.querySelectorAll('.d2-flow-dots span'));
    if(!viewport || cards.length!==6 || dots.length!==6) return;
    root.dataset.testimonialsReady='1';
    var active=0,moving=false,timer=null,touchX=0,touching=false;
    var states=['pos-center','pos-right','pos-far-right','pos-hidden','pos-far-left','pos-left'];
    var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function mod(v){return (v+cards.length)%cards.length}
    function clearTimer(){if(timer!==null){clearTimeout(timer);timer=null}}
    function removeState(card){states.forEach(function(st){card.classList.remove(st)})}
    function render(){
      cards.forEach(function(card,i){removeState(card);card.classList.add(states[mod(i-active)])});
      dots.forEach(function(dot,i){var on=i===active;dot.classList.toggle('active',on);dot.setAttribute('aria-current',on?'true':'false')});
    }
    function schedule(){clearTimer();if(!reduced&&!touching)timer=setTimeout(function(){move(1)},3000)}
    function finish(){cards.forEach(function(card){card.classList.remove('is-incoming','is-outgoing','is-resetting')});moving=false;schedule()}
    function move(direction,target){
      if(moving)return;
      clearTimer();
      var old=active;
      var next=typeof target==='number'?mod(target):mod(active+direction);
      if(next===old){schedule();return}
      moving=true;
      cards[next].classList.add('is-incoming');
      cards[old].classList.add('is-outgoing');
      active=next; render();
      setTimeout(finish,reduced?0:780);
    }
    function goTo(index){
      if(moving)return;
      var delta=mod(index-active);
      if(delta===0){schedule();return}
      move(delta<=cards.length/2?1:-1,index);
    }
    viewport.addEventListener('touchstart',function(e){if(moving||!e.touches.length)return;clearTimer();touching=true;touchX=e.touches[0].clientX},{passive:true});
    viewport.addEventListener('touchend',function(e){var delta=e.changedTouches.length?e.changedTouches[0].clientX-touchX:0;touching=false;if(Math.abs(delta)>38)move(delta<0?1:-1);else schedule()},{passive:true});
    viewport.addEventListener('touchcancel',function(){touching=false;schedule()},{passive:true});
    dots.forEach(function(dot,index){dot.addEventListener('click',function(){goTo(index)});dot.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();goTo(index)}})});
    render(); schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initTestimonials);else initTestimonials();
})();