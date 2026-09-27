document.addEventListener('DOMContentLoaded',function(){var label=document.querySelector('#dtModal .wheel-label');if(label){label.classList.add('wheel-guide');label.innerHTML='<span>Date</span><span>Hour</span><span>Minute</span><span aria-hidden="true"></span>';}});

/* ---- next script block ---- */

(function(){
  function init(){return;
    var root=document.getElementById('d2Homepage');if(!root)return;
    var viewport=root.querySelector('.d2-flow-viewport');
    var cards=Array.from(root.querySelectorAll('.d2-flow-card'));
    var dots=Array.from(root.querySelectorAll('.d2-flow-dots span'));
    if(!viewport||cards.length!==6)return;
    var active=0,moving=false,timer=null,touching=false,touchX=0;
    var states=['pos-center','pos-right','pos-far-right','pos-hidden','pos-far-left','pos-left'];
    var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function mod(value){return(value+cards.length)%cards.length}
    function clearTimer(){if(timer!==null){clearTimeout(timer);timer=null}}
    function removeState(card){for(var i=0;i<states.length;i++)card.classList.remove(states[i])}
    function render(){for(var i=0;i<cards.length;i++){removeState(cards[i]);cards[i].classList.add(states[mod(i-active)])}for(var j=0;j<dots.length;j++){var selected=j===active;dots[j].classList.toggle('active',selected);dots[j].setAttribute('aria-current',selected?'true':'false')}}
    function schedule(){clearTimer();if(!reduced&&!touching)timer=setTimeout(function(){move(1)},3000)}
    function finish(){for(var i=0;i<cards.length;i++)cards[i].classList.remove('is-incoming','is-outgoing','is-resetting');moving=false;schedule()}
    function move(direction,target){if(moving)return;clearTimer();var old=active;var next=typeof target==='number'?mod(target):mod(active+direction);if(next===old){schedule();return}moving=true;cards[next].classList.add('is-incoming');cards[old].classList.add('is-outgoing');active=next;render();setTimeout(finish,reduced?0:780)}
    function goTo(index){if(moving)return;var delta=mod(index-active);if(delta===0){schedule();return}move(delta<=cards.length/2?1:-1,index)}
    viewport.addEventListener('touchstart',function(e){if(moving||!e.touches.length)return;clearTimer();touching=true;touchX=e.touches[0].clientX},{passive:true});
    viewport.addEventListener('touchend',function(e){var delta=e.changedTouches.length?e.changedTouches[0].clientX-touchX:0;touching=false;if(Math.abs(delta)>38)move(delta<0?1:-1);else schedule()},{passive:true});
    viewport.addEventListener('touchcancel',function(){touching=false;schedule()},{passive:true});
    for(var i=0;i<dots.length;i++)(function(index){dots[index].addEventListener('click',function(){goTo(index)});dots[index].addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();goTo(index)}})})(i);
    render();schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* ---- next script block ---- */

// Static fallback list (used if live search is unavailable)
  const fallbackCities = [
    "Indore Railway Station","Indore Airport (Devi Ahilyabai Holkar)","Vijay Nagar, Indore",
    "Rajwada, Indore","Sarafa Bazaar, Indore","Palasia, Indore","Bhawarkuan, Indore",
    "Rau, Indore","Mhow, Indore","Bypass Road, Indore","AB Road, Indore","MG Road, Indore",
    "Sudama Nagar, Indore","Annapurna Road, Indore","Khajrana, Indore","Bengali Square, Indore",
    "LIG Colony, Indore","Nipania, Indore","Super Corridor, Indore","Rajendra Nagar, Indore",
    "Scheme 78, Indore","Sapna Sangeeta Road, Indore","C21 Mall, Indore","Treasure Island Mall, Indore",
    "IIT Indore, Simrol","Pithampur, Indore","Ujjain (via Indore)","Dewas (via Indore)"
  ];

  // ---- Tabs ----
  const tabs = document.querySelectorAll('.tab');
  const subheading = document.getElementById('subheading');
  const subheadingText = {
    outstation: "Indore's Trusted Outstation Cabs",
    local: "Hourly Local Rental Cabs",
    airport: "On-Time Airport Transfers"
  };
  const fromLabelText = {
    outstation: "Enter Pickup Location",
    local: "Enter Pickup Location",
    airport: "Enter Airport / Pickup"
  };
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.suggestions').forEach(box=>{
        box.classList.remove('show');
        box.innerHTML='';
      });
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.dataset.tab;
      subheading.textContent = subheadingText[key];
      document.getElementById('fromInput').placeholder = fromLabelText[key];
      document.getElementById('tripToggle').style.display = key === 'outstation' ? 'flex' : 'none';
      if(key !== 'outstation'){
        const tripButtonsAll = document.querySelectorAll('#tripToggle button');
        tripButtonsAll.forEach(b=>b.classList.remove('active'));
        document.querySelector('#tripToggle button[data-trip="oneway"]').classList.add('active');
        document.getElementById('tripEndField').style.display = 'none';
        document.getElementById('tripEndTimeField').style.display = 'none';
      }
      enforceCorrectTripType();
    });
  });

  // ---- Trip toggle (one way / round trip) ----
  const tripButtons = document.querySelectorAll('#tripToggle button');
  const tripEndField = document.getElementById('tripEndField');
  const tripEndTimeField = document.getElementById('tripEndTimeField');
  tripButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tripButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      tripEndField.style.display = btn.dataset.trip === 'round' ? 'flex' : 'none';
      tripEndTimeField.style.display = btn.dataset.trip === 'round' ? 'flex' : 'none';
      if(btn.dataset.trip === 'round'){
        const startChosen = tripStartData.chosen ? new Date(tripStartData.chosen) : new Date(Date.now()+60*60*1000);
        if(!tripEndField.dataset.chosen || new Date(tripEndField.dataset.chosen) <= startChosen){
          const endD = new Date(startChosen);
          endD.setHours(endD.getHours()+1);
          tripEndField.dataset.chosen = endD.toISOString();
          tripEndTimeField.dataset.chosen = endD.toISOString();
          const monthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          document.getElementById('endDateDisplay').textContent = `${String(endD.getDate()).padStart(2,'0')} ${monthNamesShort[endD.getMonth()]} ${endD.getFullYear()}`;
          const endDayEl = document.getElementById('endDayDisplay');
          if(endDayEl) endDayEl.textContent = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][endD.getDay()];
          let endH=endD.getHours()%12;if(!endH)endH=12;
          const endTimeEl = document.getElementById('endTimeDisplay');
          if(endTimeEl) endTimeEl.textContent=`${endH}:${String(endD.getMinutes()).padStart(2,'0')} ${endD.getHours()>=12?'PM':'AM'}`;
        }
      }
    });
  });

  // ---- From / To fields with LIVE India-wide location search (Photon API) ----
  // Bias results towards Indore, but allow matches anywhere in India.
  const INDORE_LAT = 22.7196;
  const INDORE_LON = 75.8577;
  const searchCache = new Map();

  async function searchIndoreLocations(query){
    if(searchCache.has(query)) return searchCache.get(query);
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${INDORE_LAT}&lon=${INDORE_LON}&limit=6&lang=en`;
    const res = await fetch(url, { method:'GET', mode:'cors', headers:{ 'Accept':'application/json' } });
    if(!res.ok){
      console.error('Photon request failed:', res.status, res.statusText, url);
      throw new Error('search failed: ' + res.status);
    }
    const data = await res.json();
    const features = (data.features || []).filter(f=>{
      const p = f.properties || {};
      return !p.countrycode || p.countrycode === 'IN';
    });
    const results = features.map(f=>{
      const p = f.properties || {};
      const coords = (f.geometry && f.geometry.coordinates) || [];
      const primary = p.name || p.street || p.district || 'Unknown';
      const area = p.city || p.district || p.state || 'India';
      const label = primary.toLowerCase() === area.toLowerCase() ? primary : `${primary}, ${area}`;
      return { label, lat: coords[1], lon: coords[0] };
    });
    searchCache.set(query, results);
    return results;
  }

  function setupAutocomplete(inputId, suggestionsId){
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestionsId);
    let debounceTimer;
    let requestId = 0;

    function renderFallback(val){
      const matches = fallbackCities.filter(c=>c.toLowerCase().includes(val.toLowerCase())).slice(0,6);
      if(matches.length){
        box.innerHTML = matches.map(c=>`<div data-label="${c}">${c}</div>`).join('');
        box.classList.add('show');
      } else {
        box.classList.remove('show');
      }
    }

    input.addEventListener('input', ()=>{
      const val = input.value.trim();
      clearTimeout(debounceTimer);
      if(!val){ box.classList.remove('show'); box.innerHTML=''; return; }
      if(val.length < 3){ renderFallback(val); return; }

      const myRequestId = ++requestId;
      box.innerHTML = '<div style="cursor:default;color:#8a8a8e;">Searching…</div>';
      box.classList.add('show');

      debounceTimer = setTimeout(async ()=>{
        try{
          const results = await searchIndoreLocations(val);
          if(myRequestId !== requestId) return;
          if(results.length){
            box.innerHTML = results.map(r=>`<div data-label="${r.label.replace(/"/g,'&quot;')}" data-lat="${r.lat}" data-lon="${r.lon}">${r.label}</div>`).join('');
            box.classList.add('show');
          } else {
            renderFallback(val);
          }
        } catch(err){
          console.error('Location search error:', err);
          if(myRequestId !== requestId) return;
          renderFallback(val);
        }
      }, 350);
    });

    function applyCoords(lat, lon){
      input.dataset.lat = lat;
      input.dataset.lon = lon;
      if(inputId === 'fromInput'){
        bookingInfo.fromLat = Number(lat);
        bookingInfo.fromLon = Number(lon);
      } else if(inputId === 'toInput'){
        bookingInfo.toLat = Number(lat);
        bookingInfo.toLon = Number(lon);
      }
    }

    function clearCoords(){
      delete input.dataset.lat;
      delete input.dataset.lon;
      if(inputId === 'fromInput'){
        delete bookingInfo.fromLat;
        delete bookingInfo.fromLon;
      } else if(inputId === 'toInput'){
        delete bookingInfo.toLat;
        delete bookingInfo.toLon;
      }
    }

    box.addEventListener('click', async (e)=>{
      const target = e.target.closest('div[data-label]');
      if(!target) return;

      const label = target.dataset.label;
      input.value = label;
      box.classList.remove('show');
      box.innerHTML = '';

      if(target.dataset.lat && target.dataset.lon){
        // Live Photon suggestion — already has real coordinates.
        applyCoords(target.dataset.lat, target.dataset.lon);
        enforceCorrectTripType();
        return;
      }

      // Fallback suggestion (renderFallback()) — these are just plain
      // labels with no coordinates attached, shown when the query was
      // under 3 characters (live search never even ran) or the live
      // search failed. Rather than silently leaving pickup/drop without
      // real coordinates — which used to reach the backend as 0,0 —
      // resolve the full label through the same live search used for
      // normal typing. A full landmark name like "Indore Railway Station"
      // almost always geocodes correctly even when the original short
      // query didn't trigger a live search.
      const myRequestId = ++requestId;
      try{
        const results = await searchIndoreLocations(label);
        if(myRequestId !== requestId) return; // superseded by a newer selection
        const match = results.find(r => r.label === label) || results[0];
        if(match && Number.isFinite(match.lat) && Number.isFinite(match.lon)){
          applyCoords(match.lat, match.lon);
        } else {
          clearCoords();
          showToast(`Couldn't pin an exact location for "${label}". Please pick a suggestion from the live search instead.`);
        }
      } catch(err){
        if(myRequestId !== requestId) return;
        console.error('Fallback location geocode failed:', err);
        clearCoords();
        showToast(`Couldn't pin an exact location for "${label}". Please pick a suggestion from the live search instead.`);
      }
      enforceCorrectTripType();
    });
    document.addEventListener('click', (e)=>{
      if(!input.contains(e.target) && !box.contains(e.target)){
        box.classList.remove('show');
      }
    });
  }
  setupAutocomplete('fromInput','fromSuggestions');
  setupAutocomplete('toInput','toSuggestions');

  // ---- Pick up where the dashboard's pickup/drop search left off ----
  // The dashboard (My Bookings page) has its own pickup/drop fields; when the
  // customer picks locations there and taps "Book a Ride", it stores them
  // here and sends the browser to this page so the booking flow continues
  // from the homepage form instead of starting over.
  (function applyPendingLocationsFromDashboard(){
    try{
      const raw = localStorage.getItem('d2cabsPendingLocations');
      if(!raw) return;
      const pending = JSON.parse(raw);
      const fromInput = document.getElementById('fromInput');
      const toInput = document.getElementById('toInput');
      if(pending.fromLabel && fromInput){
        fromInput.value = pending.fromLabel;
        if(pending.fromLat && pending.fromLon){
          fromInput.dataset.lat = pending.fromLat;
          fromInput.dataset.lon = pending.fromLon;
        }
      }
      if(pending.toLabel && toInput){
        toInput.value = pending.toLabel;
        if(pending.toLat && pending.toLon){
          toInput.dataset.lat = pending.toLat;
          toInput.dataset.lon = pending.toLon;
        }
      }
      localStorage.removeItem('d2cabsPendingLocations');
      window.needsRecalc = true;
      if(typeof enforceCorrectTripType === 'function') enforceCorrectTripType();
    } catch(err){
      console.error('Could not apply pending locations from dashboard:', err);
    }
  })();

  // ---- Swap ----
  document.getElementById('swapBtn').addEventListener('click', ()=>{
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    const tmp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tmp;

    const tmpLat = fromInput.dataset.lat, tmpLon = fromInput.dataset.lon;
    if(toInput.dataset.lat && toInput.dataset.lon){
      fromInput.dataset.lat = toInput.dataset.lat;
      fromInput.dataset.lon = toInput.dataset.lon;
    } else {
      delete fromInput.dataset.lat;
      delete fromInput.dataset.lon;
    }
    if(tmpLat && tmpLon){
      toInput.dataset.lat = tmpLat;
      toInput.dataset.lon = tmpLon;
    } else {
      delete toInput.dataset.lat;
      delete toInput.dataset.lon;
    }
    enforceCorrectTripType();
  });

  // ---- Date/Time Wheel Picker Modal ----
  const dtModal = document.getElementById('dtModal');
  const dateBox = document.getElementById('dateBox');
  const timeBox = document.getElementById('timeBox');
  const dtDateDisplay = document.getElementById('dtDateDisplay');
  const dtTimeDisplay = document.getElementById('dtTimeDisplay');
  const modalDtValue = document.getElementById('modalDtValue');
  const modalDtDay = document.getElementById('modalDtDay');
  const tripStartData = { chosen: null };
  let bookingInfo = { tripType:'ONE WAY', from:'Kolkata', to:'Ahmedabad', dateISO:'2026-07-14', timeStr:'19:44' };
  window.needsRecalc = true; // only recalculate distance/fare when pickup, destination or trip type change

  const wheelDate = document.getElementById('wheelDate');
  const wheelHour = document.getElementById('wheelHour');
  const wheelMinute = document.getElementById('wheelMinute');
  const wheelPeriod = document.getElementById('wheelPeriod');

  const ITEM_H = 44;
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const dateOptions = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  for(let i=0;i<60;i++){
    const d = new Date(today);
    d.setDate(d.getDate()+i);
    const label = i===0 ? 'Today' : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    dateOptions.push({date:d, label});
  }
  const hourOptions = Array.from({length:12},(_,i)=> i===0?12:i);
  const minuteOptions = Array.from({length:12},(_,i)=>i*5);
  const periodOptions = ['AM','PM'];

  function buildWheel(el, items, formatFn){
    el.innerHTML = '<div class="wheel-pad"></div>' +
      items.map((it,idx)=>`<div class="wheel-item" data-idx="${idx}">${formatFn(it)}</div>`).join('') +
      '<div class="wheel-pad"></div>';
  }
  function buildLoopWheel(el, items, formatFn){
    const repeated = Array.from({length:5},()=>items).flat();
    el.innerHTML = '<div class="wheel-pad"></div>' +
      repeated.map((it,physicalIdx)=>`<div class="wheel-item" data-idx="${physicalIdx % items.length}" data-loop="${physicalIdx}">${formatFn(it)}</div>`).join('') +
      '<div class="wheel-pad"></div>';
    el.dataset.loopCount = String(items.length);
  }
  buildWheel(wheelDate, dateOptions, it=>it.label);
  buildLoopWheel(wheelHour, hourOptions, it=>String(it).padStart(1,'0'));
  buildLoopWheel(wheelMinute, minuteOptions, it=>String(it).padStart(2,'0'));
  buildWheel(wheelPeriod, periodOptions, it=>it);

  let selected = { dateIdx:0, hourIdx:7, minuteIdx:0, periodIdx:0 };

  // Auto-fill the date & time fields with the actual current date/time on load
  (function initNowDisplay(){
    const now = new Date();
    const d = dateOptions[0].date;
    dtDateDisplay.textContent = `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    let h24 = now.getHours();
    let minute = Math.ceil(now.getMinutes()/5)*5;
    if(minute === 60){ minute = 0; h24 = (h24+1)%24; }
    const period = h24 >= 12 ? 'PM' : 'AM';
    let hour12 = h24 % 12;
    if (hour12 === 0) hour12 = 12;

    selected.hourIdx = hourOptions.indexOf(hour12);
    selected.minuteIdx = minuteOptions.indexOf(minute);
    selected.periodIdx = period === 'AM' ? 0 : 1;

    dtTimeDisplay.textContent = `${hour12}:${String(minute).padStart(2,'0')} ${period}`;

    const chosen = new Date(d);
    chosen.setHours(h24, minute, 0, 0);
    tripStartData.chosen = chosen.toISOString();
  })();

  function scrollWheelTo(el, idx, smooth){
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
  }

  function scrollLoopWheelTo(el, logicalIdx, smooth){
    const count = Number(el.dataset.loopCount);
    const middlePhysicalIdx = count * 2 + logicalIdx;
    el.scrollTo({ top: middlePhysicalIdx * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
  }

  function highlightWheel(el, idx){
    el.querySelectorAll('.wheel-item').forEach(item=>{
      item.classList.toggle('selected', Number(item.dataset.idx) === idx);
    });
  }

  function updateSummary(){
    const d = dateOptions[selected.dateIdx].date;
    const hour = hourOptions[selected.hourIdx];
    const minute = minuteOptions[selected.minuteIdx];
    const period = periodOptions[selected.periodIdx];
    const dateStr = `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const timeStr = `${hour}:${String(minute).padStart(2,'0')} ${period}`;
    modalDtValue.textContent = `${dateStr}, ${timeStr}`;
    const fullDayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    modalDtDay.textContent = fullDayName;
  }

  function attachWheelScroll(el, key, count){
    let settleTimer;
    let framePending = false;
    el.addEventListener('scroll', ()=>{
      if(!framePending){
        framePending = true;
        requestAnimationFrame(()=>{
          framePending = false;
          let idx = Math.round(el.scrollTop / ITEM_H);
          idx = Math.max(0, Math.min(count-1, idx));
          selected[key] = idx;
          highlightWheel(el, idx);
          updateSummary();
        });
      }
      clearTimeout(settleTimer);
      settleTimer = setTimeout(()=>{
        let idx = Math.round(el.scrollTop / ITEM_H);
        idx = Math.max(0, Math.min(count-1, idx));
        selected[key] = idx;
        scrollWheelTo(el, idx, false);
        highlightWheel(el, idx);
        updateSummary();
      }, 35);
    });
  }
  function attachLoopWheelScroll(el, key, count){
    let settleTimer;
    let framePending = false;
    const sync = ()=>{
      const physicalIdx = Math.round(el.scrollTop / ITEM_H);
      const logicalIdx = ((physicalIdx % count) + count) % count;
      selected[key] = logicalIdx;
      highlightWheel(el, logicalIdx);
      updateSummary();
      return {physicalIdx, logicalIdx};
    };
    el.addEventListener('scroll', ()=>{
      if(!framePending){framePending=true;requestAnimationFrame(()=>{framePending=false;sync();});}
      clearTimeout(settleTimer);
      settleTimer = setTimeout(()=>{
        const {physicalIdx, logicalIdx} = sync();
        if(physicalIdx < count || physicalIdx >= count * 4){
          scrollLoopWheelTo(el, logicalIdx, false);
        } else {
          el.scrollTo({top:physicalIdx * ITEM_H,behavior:'auto'});
        }
      },35);
    });
  }
  attachWheelScroll(wheelDate,'dateIdx', dateOptions.length);
  attachLoopWheelScroll(wheelHour,'hourIdx', hourOptions.length);
  attachLoopWheelScroll(wheelMinute,'minuteIdx', minuteOptions.length);
  attachWheelScroll(wheelPeriod,'periodIdx', periodOptions.length);

  function initWheels(){
    scrollWheelTo(wheelDate, selected.dateIdx, false);
    scrollLoopWheelTo(wheelHour, selected.hourIdx, false);
    scrollLoopWheelTo(wheelMinute, selected.minuteIdx, false);
    scrollWheelTo(wheelPeriod, selected.periodIdx, false);
    highlightWheel(wheelDate, selected.dateIdx);
    highlightWheel(wheelHour, selected.hourIdx);
    highlightWheel(wheelMinute, selected.minuteIdx);
    highlightWheel(wheelPeriod, selected.periodIdx);
    updateSummary();
  }

  function openModal(){
    dtModal.classList.add('show');
    requestAnimationFrame(initWheels);
  }
  function closeModal(){
    dtModal.classList.remove('show');
  }

  dateBox.addEventListener('click', openModal);
  timeBox.addEventListener('click', openModal);
  document.getElementById('dtModalClose').addEventListener('click', closeModal);
  dtModal.addEventListener('click', (e)=>{ if(e.target === dtModal) closeModal(); });

  document.getElementById('dtModalContinue').addEventListener('click', ()=>{
    const d = dateOptions[selected.dateIdx].date;
    const hour = hourOptions[selected.hourIdx];
    const minute = minuteOptions[selected.minuteIdx];
    const period = periodOptions[selected.periodIdx];
    dtDateDisplay.textContent = `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    dtTimeDisplay.textContent = `${hour}:${String(minute).padStart(2,'0')} ${period}`;
    let h24 = hour % 12;
    if(period === 'PM') h24 += 12;
    const chosen = new Date(d);
    chosen.setHours(h24, minute, 0, 0);
    tripStartData.chosen = chosen.toISOString();
    if(!tripEndField.dataset.chosen || new Date(tripEndField.dataset.chosen) < chosen){
      const endD = new Date(chosen);
      endD.setHours(endD.getHours()+1);
      tripEndField.dataset.chosen = endD.toISOString();
      tripEndTimeField.dataset.chosen = endD.toISOString();
      endDateDisplay.textContent = `${String(endD.getDate()).padStart(2,'0')} ${monthNames[endD.getMonth()]} ${endD.getFullYear()}`;
      endDayDisplay.textContent = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][endD.getDay()];
      let endH=endD.getHours()%12;if(!endH)endH=12;
      endTimeDisplay.textContent=`${endH}:${String(endD.getMinutes()).padStart(2,'0')} ${endD.getHours()>=12?'PM':'AM'}`;
    }
    closeModal();
  });

  // ---- Trip End date-only picker ----
  const dtModalEnd = document.getElementById('dtModalEnd');
  const endDateDisplay = document.getElementById('endDateDisplay');
  const endDayDisplay = document.getElementById('endDayDisplay');
  const modalEndDtValue = document.getElementById('modalEndDtValue');
  const modalEndDtDay = document.getElementById('modalEndDtDay');
  const wheelEndDate = document.getElementById('wheelEndDate');

  buildWheel(wheelEndDate, dateOptions, it=>it.label);
  let endSelected = { dateIdx:0 };

  function updateEndSummary(){
    const d = dateOptions[endSelected.dateIdx].date;
    modalEndDtValue.textContent = `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    modalEndDtDay.textContent = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  }

  function attachWheelScroll_v2(el, count, onChange){
    let debounce;
    el.addEventListener('scroll', ()=>{
      clearTimeout(debounce);
      debounce = setTimeout(()=>{
        let idx = Math.round(el.scrollTop / ITEM_H);
        idx = Math.max(0, Math.min(count-1, idx));
        scrollWheelTo(el, idx, true);
        highlightWheel(el, idx);
        onChange(idx);
      }, 90);
    });
  }
  attachWheelScroll_v2(wheelEndDate, dateOptions.length, (idx)=>{
    endSelected.dateIdx = idx;
    updateEndSummary();
  });

  function openEndModal(){
    const startDate = tripStartData.chosen ? new Date(tripStartData.chosen) : dateOptions[0].date;
    let idx = dateOptions.findIndex(o => o.date.toDateString() === startDate.toDateString());
    if(idx === -1) idx = 0;
    endSelected.dateIdx = idx;
    dtModalEnd.classList.add('show');
    requestAnimationFrame(()=>{
      scrollWheelTo(wheelEndDate, idx, false);
      highlightWheel(wheelEndDate, idx);
      updateEndSummary();
    });
  }
  function closeEndModal(){
    dtModalEnd.classList.remove('show');
  }

  tripEndField.addEventListener('click', openEndModal);
  document.getElementById('dtModalEndClose').addEventListener('click', closeEndModal);
  dtModalEnd.addEventListener('click', (e)=>{ if(e.target === dtModalEnd) closeEndModal(); });

  document.getElementById('dtModalEndContinue').addEventListener('click', ()=>{
    const d = dateOptions[endSelected.dateIdx].date;
    endDateDisplay.textContent = `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    endDayDisplay.textContent = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const existingEnd = tripEndTimeField.dataset.chosen ? new Date(tripEndTimeField.dataset.chosen) : new Date(tripStartData.chosen || d);
    d.setHours(existingEnd.getHours(), existingEnd.getMinutes(), 0, 0);
    tripEndField.dataset.chosen = d.toISOString();
    tripEndTimeField.dataset.chosen = d.toISOString();
    closeEndModal();
  });

  // ---- Trip End time picker ----
  const dtModalEndTime = document.getElementById('dtModalEndTime');
  const endTimeDisplay = document.getElementById('endTimeDisplay');
  const modalEndTimeValue = document.getElementById('modalEndTimeValue');
  const wheelEndHour = document.getElementById('wheelEndHour');
  const wheelEndMinute = document.getElementById('wheelEndMinute');
  const wheelEndPeriod = document.getElementById('wheelEndPeriod');
  buildLoopWheel(wheelEndHour, hourOptions, it=>String(it));
  buildLoopWheel(wheelEndMinute, minuteOptions, it=>String(it).padStart(2,'0'));
  buildWheel(wheelEndPeriod, periodOptions, it=>it);
  let endTimeSelected = {hourIdx:selected.hourIdx, minuteIdx:selected.minuteIdx, periodIdx:selected.periodIdx};
  function updateEndTimeSummary(){
    const h=hourOptions[endTimeSelected.hourIdx], m=minuteOptions[endTimeSelected.minuteIdx], p=periodOptions[endTimeSelected.periodIdx];
    modalEndTimeValue.textContent = `${h}:${String(m).padStart(2,'0')} ${p}`;
  }
  attachLoopWheelScroll(wheelEndHour,'__unusedHour',hourOptions.length);
  attachLoopWheelScroll(wheelEndMinute,'__unusedMinute',minuteOptions.length);
  attachWheelScroll(wheelEndPeriod,'__unusedPeriod',periodOptions.length);
  function syncEndTimeFromWheels(){
    endTimeSelected.hourIdx=((Math.round(wheelEndHour.scrollTop/ITEM_H)%hourOptions.length)+hourOptions.length)%hourOptions.length;
    endTimeSelected.minuteIdx=((Math.round(wheelEndMinute.scrollTop/ITEM_H)%minuteOptions.length)+minuteOptions.length)%minuteOptions.length;
    endTimeSelected.periodIdx=Math.max(0,Math.min(1,Math.round(wheelEndPeriod.scrollTop/ITEM_H)));
    highlightWheel(wheelEndHour,endTimeSelected.hourIdx); highlightWheel(wheelEndMinute,endTimeSelected.minuteIdx); highlightWheel(wheelEndPeriod,endTimeSelected.periodIdx); updateEndTimeSummary();
  }
  [wheelEndHour,wheelEndMinute,wheelEndPeriod].forEach(w=>w.addEventListener('scroll',()=>requestAnimationFrame(syncEndTimeFromWheels)));
  function openEndTimeModal(){
    const base=new Date(tripEndTimeField.dataset.chosen || tripEndField.dataset.chosen || tripStartData.chosen || Date.now());
    const p=base.getHours()>=12?'PM':'AM'; let h=base.getHours()%12; if(!h)h=12;
    endTimeSelected.hourIdx=hourOptions.indexOf(h); endTimeSelected.minuteIdx=Math.max(0,minuteOptions.indexOf(Math.round(base.getMinutes()/5)*5%60)); endTimeSelected.periodIdx=p==='PM'?1:0;
    dtModalEndTime.classList.add('show');
    requestAnimationFrame(()=>{scrollLoopWheelTo(wheelEndHour,endTimeSelected.hourIdx,false);scrollLoopWheelTo(wheelEndMinute,endTimeSelected.minuteIdx,false);scrollWheelTo(wheelEndPeriod,endTimeSelected.periodIdx,false);syncEndTimeFromWheels();});
  }
  function closeEndTimeModal(){dtModalEndTime.classList.remove('show');}
  tripEndTimeField.addEventListener('click',openEndTimeModal);
  document.getElementById('dtModalEndTimeClose').addEventListener('click',closeEndTimeModal);
  dtModalEndTime.addEventListener('click',e=>{if(e.target===dtModalEndTime)closeEndTimeModal();});
  document.getElementById('dtModalEndTimeContinue').addEventListener('click',()=>{
    syncEndTimeFromWheels();
    const dateBase=new Date(tripEndField.dataset.chosen || tripStartData.chosen || Date.now());
    const h12=hourOptions[endTimeSelected.hourIdx], p=periodOptions[endTimeSelected.periodIdx]; let h24=h12%12;if(p==='PM')h24+=12;
    dateBase.setHours(h24,minuteOptions[endTimeSelected.minuteIdx],0,0);
    const start=new Date(tripStartData.chosen || 0);
    if(dateBase<=start){document.getElementById('dateError').textContent='Trip end time must be after trip start.';document.getElementById('dateError').classList.add('show');return;}
    tripEndField.dataset.chosen=dateBase.toISOString();tripEndTimeField.dataset.chosen=dateBase.toISOString();endTimeDisplay.textContent=`${h12}:${String(minuteOptions[endTimeSelected.minuteIdx]).padStart(2,'0')} ${p}`;document.getElementById('dateError').classList.remove('show');closeEndTimeModal();
  });

  // ---- Circle selector + cab card: two-way sync (tapping either selects both) ----
  const circleOptions = document.querySelectorAll('.circle-option');

  function selectCab(key, {scroll=false} = {}){
    circleOptions.forEach(o=>o.classList.toggle('active', o.dataset.cab === key));
    document.querySelectorAll('.cab-card').forEach(c=>c.classList.toggle('selected', c.dataset.cab === key));
    if(scroll){
      const targetCard = document.querySelector(`.cab-card[data-cab="${key}"]`);
      if(targetCard) targetCard.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  }

  circleOptions.forEach(opt=>{
    opt.addEventListener('click', ()=>{
      selectCab(opt.dataset.cab, {scroll:true});
    });
  });

  // ---- Tap a cab card to select it (also highlights the matching circle above) ----
  document.querySelectorAll('.cab-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('.cab-select-btn')) return; // Select button has its own action
      selectCab(card.dataset.cab);
    });
  });

  // ---- Individual Select buttons on each cab card ----
  const CAR_EXTRA = {
    wagonr: { bags:'2 Bags', fuel:'CNG' },
    dzire:  { bags:'2 Bags', fuel:'Petrol' },
    amaze:  { bags:'2 Bags', fuel:'Petrol' },
    aura:   { bags:'2 Bags', fuel:'CNG' },
    ertiga: { bags:'4 Bags', fuel:'CNG' },
    crysta: { bags:'4 Bags', fuel:'Diesel' }
  };
  const ICON_SEAT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_BAG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="8" width="12" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" stroke-width="2"/></svg>';
  const ICON_AC = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_FUEL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 21V8a2 2 0 012-2h6a2 2 0 012 2v13" stroke="currentColor" stroke-width="2"/><path d="M3 21h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 9h2l2 2v6a1.5 1.5 0 01-3 0v-2h-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function setDetailCopy(item, title, text){
    if(!item) return;
    const heading=item.querySelector('h4'), paragraph=item.querySelector('p');
    if(heading) heading.textContent=title;
    if(paragraph) paragraph.textContent=text;
  }

  function updateCabSpecificDetails(cabKey, seats){
    const pricing=CAB_PRICING_CONFIG[cabKey] || CAB_PRICING_CONFIG.dzire;
    const activeTab=document.querySelector('.tab.active')?.dataset.tab || 'outstation';
    const rate=(pricing[activeTab] || pricing.outstation).perKm;
    document.querySelectorAll('.details-tabs-section').forEach(section=>{
      const inclusions=section.querySelector('.details-panel[data-panel="inclusions"]')?.querySelectorAll('.details-item');
      const exclusions=section.querySelector('.details-panel[data-panel="exclusions"]')?.querySelectorAll('.details-item');
      const terms=section.querySelector('.details-panel[data-panel="tc"]')?.querySelectorAll('.details-item');
      const setRate=(item, text)=>{
        const paragraph=item?.querySelector('p');
        if(paragraph) paragraph.textContent=text;
      };
      setRate(inclusions?.[0], `₹${rate}.0/km will apply beyond the included kms`);
      setRate(exclusions?.[0], `₹${rate}.0/km applies for distance beyond the included kms`);
      setRate(terms?.[0], `₹${rate}.0/km applies beyond the included kms`);
    });
  }

  document.querySelectorAll('.cab-select-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.cab-card');
      if(card) selectCab(card.dataset.cab);
      goToConfirmScreen(card, btn);
    });
  });

  // ---- Update confirm screen car details when circle option is tapped ----
  function updateConfirmCarDetails(cabKey){
    const sourceCard = document.querySelector(`.cab-card[data-cab="${cabKey}"]`);
    if(!sourceCard) return;

    const imgSrc = sourceCard.dataset.confirmSrc || sourceCard.querySelector('.cab-image img').src;
    const type = sourceCard.querySelector('.cab-type-badge').textContent;
    const rating = sourceCard.querySelector('.cab-rating').textContent;
    const name = sourceCard.querySelector('.cab-name').textContent;
    const specs = sourceCard.querySelector('.cab-specs').textContent;
    const [, , seats] = specs.split('·').map(s=>s.trim());
    const extra = CAR_EXTRA[cabKey] || { bags:'2 Bags', fuel:'Petrol' };

    // Authoritative fare figures straight from the pricing engine (never hardcoded).
    // Falls back to whatever is currently on the card only if the engine hasn't
    // run yet (e.g. distance/trip type not resolved).
    const breakdown = window.fareBreakdownByCab ? window.fareBreakdownByCab[cabKey] : null;
    const orig = breakdown ? formatFareAmount(Math.round(breakdown.originalPrice)) : sourceCard.querySelector('.cab-original-price').textContent;
    const price = breakdown ? formatFareAmount(Math.round(breakdown.finalFare)) : sourceCard.querySelector('.cab-price').textContent;
    const disc = breakdown ? `${Math.round(breakdown.discount.percent)}% OFF` : sourceCard.querySelector('.cab-discount-tag').textContent;

    document.getElementById('confirmImg').src = imgSrc;
    document.getElementById('confirmImg').alt = name;
    const ratingParts = rating.split(' ');
    document.getElementById('confirmRating').innerHTML = '<span class="rating-star">'+ratingParts[0]+'</span> <span class="rating-num">'+ratingParts[1]+'</span>';
    document.getElementById('confirmType').textContent = type;
    document.getElementById('confirmOrig').textContent = orig;
    document.getElementById('confirmPrice').textContent = price;
    document.getElementById('confirmDisc').textContent = disc;
    document.getElementById('confirmName').textContent = name;
    document.getElementById('confirmSpecGrid').innerHTML = `
      <div class="cab-spec-item"><span class="spec-icon-circle">${ICON_SEAT}</span>${seats}</div>
      <div class="cab-spec-item spec-shift-right"><span class="spec-icon-circle">${ICON_BAG}</span>${extra.bags}</div>
      <div class="cab-spec-item"><span class="spec-icon-circle">${ICON_AC}</span>AC</div>
      <div class="cab-spec-item spec-shift-right"><span class="spec-icon-circle">${ICON_FUEL}</span>${extra.fuel}</div>
    `;
    updateCabSpecificDetails(cabKey,seats);

    // Keep the single source-of-truth booking object synchronized across screens
    bookingInfo.cabKey = cabKey;
    bookingInfo.cabName = name;
    bookingInfo.cabType = type;
    if(breakdown){
      bookingInfo.fare = breakdown.fare;
      bookingInfo.driverAllowance = breakdown.driverAllowance;
      bookingInfo.gst = breakdown.gst;
      bookingInfo.originalPrice = breakdown.originalPrice;
      bookingInfo.discountAmount = breakdown.discount.amount;
      bookingInfo.discountPercent = breakdown.discount.percent;
      bookingInfo.offerPrice = breakdown.finalFare;
      bookingInfo.finalAmount = breakdown.finalFare;
    } else {
      // Engine hasn't produced a breakdown yet — derive numbers from the
      // displayed card text instead of leaving stale/hardcoded values.
      bookingInfo.offerPrice = parseFareAmount(price);
      bookingInfo.originalPrice = parseFareAmount(orig);
      bookingInfo.finalAmount = bookingInfo.offerPrice;
    }
  }

  // ---- Navigate to the confirm screen, reusing the same header + circle row ----
  function goToConfirmScreen(sourceCard, btn){
    const confirmScreen = document.getElementById('confirmScreen');
    const carCard = document.getElementById('confirmImg').closest('.confirm-car-card');

    // remove any previously cloned header/circles
    confirmScreen.querySelectorAll('.results-header, .circle-row').forEach(el=>el.remove());

    // clone the header (route/date/time + Edit Booking) and the circle row as-is
    const headerClone = document.getElementById('routeLine').closest('.results-header').cloneNode(true);
    const circleClone = document.getElementById('circleRow').cloneNode(true);

    confirmScreen.insertBefore(circleClone, carCard);
    confirmScreen.insertBefore(headerClone, circleClone);
    const confirmProgress = confirmScreen.querySelector('.booking-progress');
    if(confirmProgress) headerClone.insertAdjacentElement('afterend', confirmProgress);

    // re-wire the cloned Edit Booking button to go straight back to the booking form (1st page)
    const editBtnClone = headerClone.querySelector('#editBookingBtn');
    editBtnClone.removeAttribute('id');
    editBtnClone.addEventListener('click', ()=>{
      confirmScreen.style.display = 'none';
      goBackToForm();
    });

    // re-wire the cloned circle options to update car details when tapped
    circleClone.removeAttribute('id');
    circleClone.querySelectorAll('.circle-option').forEach(opt=>{
      opt.addEventListener('click', ()=>{
        circleClone.querySelectorAll('.circle-option').forEach(o=>o.classList.remove('active'));
        opt.classList.add('active');
        const selectedCabKey = opt.dataset.cab;
        updateConfirmCarDetails(selectedCabKey);
      });
    });

    // ---- populate the selected-car detail card (also syncs bookingInfo) ----
    const key = sourceCard.dataset.cab;
    updateConfirmCarDetails(key);

    document.getElementById('confirmBookBtn').dataset.cabName = bookingInfo.cabName;
    document.getElementById('confirmBookBtn').dataset.cabPrice = formatFareAmount(Math.round(bookingInfo.offerPrice));
    document.getElementById('confirmBookBtn').dataset.cabKey = key;

    showScreen('confirmScreen');
  }

  // ---- Confirm screen: Inclusions/Exclusions/Facilities/T&C tabs (reusable so cloned copies work too) ----
  function initDetailsTabs(section){
    if(!section) return;
    const tabsRow = section.querySelector('.details-tabs');
    tabsRow.addEventListener('click', (e)=>{
      const btn = e.target.closest('.details-tab');
      if(!btn) return;
      tabsRow.querySelectorAll('.details-tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.panel;
      section.querySelectorAll('.details-panel').forEach(p=>p.classList.remove('active'));
      section.querySelector(`.details-panel[data-panel="${key}"]`).classList.add('active');
    });
  }
  initDetailsTabs(document.getElementById('detailsTabsSection'));

  // ---- Explore Cabs ----
  // ---- Screen navigation: only one of these is ever visible at a time ----
  const SCREEN_IDS = ['homeScreen','resultsScreen','confirmScreen','paymentScreen','pendingApprovalScreen','checkoutScreen','confirmationScreen'];
  function showScreen(id){
    SCREEN_IDS.forEach(sid=>{
      const el = document.getElementById(sid);
      if(el) el.style.display = (sid === id) ? 'block' : 'none';
    });
    const marketingSections = document.getElementById('d2Homepage');
    if(marketingSections) marketingSections.style.display = (id === 'homeScreen') ? '' : 'none';
    const heroBanner = document.querySelector('.integrated-hero');
    const headerBar = document.querySelector('.faq-header');
    const phoneWrap = document.querySelector('.phone');
    const bookingStage = document.querySelector('.d2-booking-stage');
    if(bookingStage) bookingStage.classList.toggle('d2-non-home', id !== 'homeScreen');
    if(phoneWrap) phoneWrap.classList.toggle('d2-non-home-phone', id !== 'homeScreen');
    if(heroBanner) heroBanner.style.display = (id === 'homeScreen') ? '' : 'none';
    if(headerBar) headerBar.style.setProperty('display', (id === 'homeScreen') ? 'flex' : 'none', 'important');
    if(phoneWrap) phoneWrap.style.paddingTop = (id === 'homeScreen') ? phoneWrap.dataset.headerOffset || '' : '0px';
    const activeScreen = document.getElementById(id);
    requestAnimationFrame(()=>{
      if(!activeScreen) return;
      activeScreen.querySelectorAll('.info-carousel-wrap').forEach(wrap=>{
        if(typeof wrap._refreshCarousel === 'function') wrap._refreshCarousel();
      });
    });
    window.scrollTo(0,0);
  }

  // ---- Back buttons: pure screen navigation only, never touch bookingInfo,
  // ---- fareBreakdownByCab, the selected cab, or the geocoded from/to
  // ---- coordinates (dataset.lat/lon) — so nothing entered/calculated is lost.
  const resultsBackBtn = document.getElementById('resultsBackBtn');
  if(resultsBackBtn) resultsBackBtn.addEventListener('click', ()=>{
    document.getElementById('paymentStickyBar').style.display = 'none';
    showScreen('homeScreen');
  });

  const confirmBackBtn = document.getElementById('confirmBackBtn');
  if(confirmBackBtn) confirmBackBtn.addEventListener('click', ()=>{
    showScreen('resultsScreen');
  });

  const paymentBackBtn = document.getElementById('paymentBackBtn');
  if(paymentBackBtn) paymentBackBtn.addEventListener('click', ()=>{
    document.getElementById('paymentStickyBar').style.display = 'none';
    showScreen('confirmScreen');
  });

  const checkoutBackBtn = document.getElementById('checkoutBackBtn');
  if(checkoutBackBtn) checkoutBackBtn.addEventListener('click', ()=>{
    showScreen('paymentScreen');
    document.getElementById('paymentStickyBar').style.display = 'block';
  });

  const toast = document.getElementById('toast');
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 2600);
  }

  document.getElementById('confirmBookBtn').addEventListener('click', function(){
    goToPaymentScreen(this);
  });

  // ---- Navigate to the payment screen, reusing the same header (route/date/time) ----
  function goToPaymentScreen(bookBtn){
    const confirmScreen = document.getElementById('confirmScreen');
    const paymentScreen = document.getElementById('paymentScreen');

    // remember which cab/price was booked, for the final confirmation toast
    paymentScreen.dataset.cabName = bookBtn.dataset.cabName;
    paymentScreen.dataset.cabPrice = bookBtn.dataset.cabPrice;
    paymentScreen.dataset.cabKey = bookBtn.dataset.cabKey;

    // remove any previously cloned header/info-carousel/details-tabs (stop old carousel timer first)
    const oldWrap = paymentScreen.querySelector('.info-carousel-wrap');
    if(oldWrap && oldWrap._stopCarousel) oldWrap._stopCarousel();
    paymentScreen.querySelectorAll('.results-header, .info-carousel-wrap, .details-tabs-section').forEach(el=>el.remove());

    // clone the header (route/date/time + Edit Booking), same as the 3rd/confirm page, to the very top
    const sourceHeader = confirmScreen.querySelector('.results-header');
    const headerClone = sourceHeader.cloneNode(true);
    const editBtnClone = headerClone.querySelector('.edit-booking-btn');
    editBtnClone.removeAttribute('id');
    editBtnClone.addEventListener('click', ()=>{
      paymentScreen.style.display = 'none';
      document.getElementById('paymentStickyBar').style.display = 'none';
      goBackToForm();
    });
    const paymentBackRow = paymentScreen.querySelector('.back-row');
    paymentScreen.insertBefore(headerClone, paymentBackRow ? paymentBackRow.nextSibling : paymentScreen.firstElementChild);

    // clone the rotating info carousel, same as the 3rd/confirm page, right under Trip Details
    const carouselWrapClone = document.getElementById('infoCarouselWrap').cloneNode(true);
    carouselWrapClone.removeAttribute('id');
    carouselWrapClone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    const tripBox = paymentScreen.querySelector('.trip-details-box');
    tripBox.parentNode.insertBefore(carouselWrapClone, tripBox.nextSibling);
    initInfoCarousel(carouselWrapClone);

    // clone the Inclusions/Exclusions/Facilities/T&C container, same to same as the 3rd/confirm page, placed right after Additional Requests
    const detailsSection = document.getElementById('detailsTabsSection');
    const detailsClone = detailsSection.cloneNode(true);
    detailsClone.removeAttribute('id');
    detailsClone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    detailsClone.querySelectorAll('.details-tab').forEach((t,i)=>t.classList.toggle('active', i===0));
    detailsClone.querySelectorAll('.details-panel').forEach((p,i)=>p.classList.toggle('active', i===0));
    const addonBox = paymentScreen.querySelector('#addonChips').closest('.detail-box');
    addonBox.parentNode.insertBefore(detailsClone, addonBox.nextSibling);
    initDetailsTabs(detailsClone);

    // populate the trip details block at the very top of the page
    document.getElementById('journeyVal').textContent = bookingInfo.tripType;
    document.getElementById('fromVal').textContent = bookingInfo.from;
    document.getElementById('toVal').textContent = bookingInfo.to;
    document.getElementById('dateVal').textContent = bookingInfo.dateISO;
    document.getElementById('timeVal').textContent = bookingInfo.timeStr;

    // reset addon chips, coupon field and message each time this screen is opened fresh
    document.querySelectorAll('#addonChips input[type="checkbox"]').forEach(cb=>cb.checked=false);
    document.getElementById('couponCode').value = '';
    const couponMsg = document.getElementById('couponMsg');
    couponMsg.textContent = '';
    couponMsg.classList.remove('show');

    showScreen('paymentScreen');
    document.getElementById('paymentStickyBar').style.display = 'block';
    updateStickyFare();
  }

  // ---- Sticky bottom payment bar: fare breakdown + pay-option selection ----
  function parseFareAmount(str){
    return parseInt(String(str || '').replace(/[^\d]/g,''), 10) || 0;
  }
  function formatFareAmount(num){
    return '₹' + num.toLocaleString('en-IN');
  }
  function updateStickyFare(){
    const paymentScreen = document.getElementById('paymentScreen');
    const cabKey = paymentScreen.dataset.cabKey;
    const breakdown = (cabKey && window.fareBreakdownByCab) ? window.fareBreakdownByCab[cabKey] : null;

    let total, original, base, driver, gst;
    if(breakdown){
      // Exact figures from the recalculated pricing engine (auto trip detection)
      base = Math.round(breakdown.fare);
      driver = Math.round(breakdown.driverAllowance);
      gst = Math.round(breakdown.gst);
      total = Math.round(breakdown.finalFare);
      original = Math.round(breakdown.originalPrice);
      bookingInfo.fare = breakdown.fare;
      bookingInfo.driverAllowance = breakdown.driverAllowance;
      bookingInfo.gst = breakdown.gst;
      bookingInfo.originalPrice = breakdown.originalPrice;
      bookingInfo.discountAmount = breakdown.discount.amount;
      bookingInfo.discountPercent = breakdown.discount.percent;
      bookingInfo.offerPrice = breakdown.finalFare;
    } else {
      // Fallback estimate, used only before any locations/distance are known
      total = parseFareAmount(paymentScreen.dataset.cabPrice);
      original = Math.round(total * 1.22);
      base = Math.round(total * 0.7058);
      driver = Math.round(total * 0.2466);
      gst = total - base - driver;
      bookingInfo.offerPrice = total;
    }
    const addonAmount = bookingInfo.addonAmount || 0;
    const totalWithAddons = total + addonAmount;
    const originalWithAddons = original + addonAmount;
    document.getElementById('psbFareOriginal').textContent = formatFareAmount(originalWithAddons);
    document.getElementById('psbFareAmount').textContent = formatFareAmount(totalWithAddons);
    const offPct = originalWithAddons > 0 ? Math.round(((originalWithAddons - totalWithAddons) / originalWithAddons) * 100) : 0;
    document.getElementById('psbFareOff').textContent = offPct + '% OFF';
    document.getElementById('psbBase').textContent = formatFareAmount(base);
    document.getElementById('psbDriver').textContent = formatFareAmount(driver);
    document.getElementById('psbGst').textContent = formatFareAmount(gst);
    document.getElementById('psbAddons').textContent = formatFareAmount(addonAmount);
    document.getElementById('psbTotal').textContent = formatFareAmount(totalWithAddons);
    updatePayNowAmount();
  }
  function updatePayNowAmount(){
    const total = (bookingInfo.offerPrice || parseFareAmount(document.getElementById('paymentScreen').dataset.cabPrice)) + (bookingInfo.addonAmount || 0);
    const activeBtn = document.querySelector('.psb-pay-option.active');
    const pct = activeBtn ? parseInt(activeBtn.dataset.pct, 10) : 25;
    const amt = Math.round(total * pct / 100);
    document.getElementById('psbPayNowAmt').textContent = formatFareAmount(amt);
    bookingInfo.paidPercent = pct;
    bookingInfo.finalAmount = amt;
  }
  document.getElementById('psbFareToggle').addEventListener('click', ()=>{
    document.getElementById('psbBreakdown').classList.toggle('open');
  });
  function toggleCheckoutFareBreakdown(){
    const breakdown = document.getElementById('checkoutFareBreakdown');
    const toggle = document.getElementById('checkoutFareToggle');
    const isOpen = breakdown.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  }
  document.getElementById('checkoutFareToggle').addEventListener('click', toggleCheckoutFareBreakdown);
  document.getElementById('checkoutFareToggle').addEventListener('keydown', event=>{
    if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); toggleCheckoutFareBreakdown(); }
  });
  document.querySelectorAll('.psb-pay-option').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.psb-pay-option').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      updatePayNowAmount();
    });
  });

  // ---- Additional Requests: Roof Carrier / Driver Language / New Vehicle (native checkboxes, multi-select) ----
  const ADDON_PRICES = { roof:200, language:150, vehicle:500 };
  document.querySelectorAll('#addonChips input[name="addon"]').forEach(input=>{
    input.addEventListener('change', ()=>{
      const selected = [...document.querySelectorAll('#addonChips input[name="addon"]:checked')];
      bookingInfo.addonAmount = selected.reduce((sum, item)=>sum + (ADDON_PRICES[item.value] || 0), 0);
      bookingInfo.addons = selected.map(item=>item.value);
      updateStickyFare();
    });
  });

  // ---- Coupon code apply ----
  document.getElementById('applyCouponBtn').addEventListener('click', ()=>{
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    const couponMsg = document.getElementById('couponMsg');
    if(!code){
      couponMsg.textContent = 'Please enter a coupon code.';
      couponMsg.classList.add('show');
      return;
    }
    // Coupons are not implemented on the server yet, so never say a coupon was "applied".
    couponMsg.style.color = '#d70015';
    couponMsg.textContent = 'Coupon codes are not available yet.';
    couponMsg.classList.add('show');
  });

  // Local (Indian) calendar date as YYYY-MM-DD. toISOString() is UTC and gives the WRONG day
  // for bookings made between 00:00 and 05:30 IST.
  function localDateISO(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function daysBetweenISO(startISO, endISO){
    const diff = Math.round((Date.parse(endISO + 'T00:00:00Z') - Date.parse(startISO + 'T00:00:00Z')) / 86400000);
    return Math.max(1, diff + 1);
  }

  function generateBookingId(){
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
    return `CB${stamp}${rand}`;
  }

  // -------------------------------------------------------------------------
  // REAL PAYMENT FLOW (Razorpay)
  // -------------------------------------------------------------------------
  // The Key ID is public and may be kept in the frontend. Never place the
  // Razorpay Key Secret here. The two URLs below must point to your server:
  //   createOrderUrl  -> creates a Razorpay order after recalculating amount
  //   verifyPaymentUrl -> verifies Razorpay's signature using the Key Secret
  // Confirmation is intentionally impossible until verification returns
  // { verified: true, captured: true }. This prevents an unpaid or merely
  // authorised (not captured) booking from being confirmed.
  // Real payments only. The Razorpay Key ID is sent by the server with each order.
  const PAYMENT_CONFIG = {
    demoMode: true,
    businessName: 'D2 Cabs',
    themeColor: '#123A5C'
  };

  let gatewayPaymentInProgress = false;
  let pendingRazorpayResponse = null;

  function setCheckoutStatus(message, type){
    const status = document.getElementById('checkoutStatus');
    status.textContent = message || '';
    status.className = 'checkout-status' + (message ? ' show' : '') + (type ? ` ${type}` : '');
  }

  function setGatewayButtonMode(mode){
    const btn = document.getElementById('openGatewayBtn');
    if(mode === 'verify'){
      btn.textContent = 'RETRY PAYMENT VERIFICATION';
      btn.disabled = false;
    } else {
      const amountText = formatFareAmount(Math.round(bookingInfo.finalAmount || 0));
      const methodLabels = { upi:'UPI', card:'CARD', netbanking:'NET BANKING', wallet:'WALLET' };
      const selectedMethod = getSelectedCheckoutMethod();
      if(!selectedMethod){
        btn.textContent = 'SELECT PAYMENT METHOD';
        btn.disabled = true;
        return;
      }
      const action = PAYMENT_CONFIG.demoMode ? 'TEST' : 'PAY';
      btn.innerHTML = `${action} ${amountText} VIA ${methodLabels[selectedMethod] || 'RAZORPAY'}`;
      btn.disabled = false;
    }
  }

  function getSelectedCheckoutMethod(){
    return (document.querySelector('input[name="checkoutMethod"]:checked') || {}).value || '';
  }

  function getRazorpayMethodConfig(method){
    return {
      display: {
        blocks: {
          preferred: {
            name: 'Your Selected Payment Method',
            instruments: [{ method: method }]
          }
        },
        sequence: ['block.preferred'],
        preferences: { show_default_blocks: true }
      }
    };
  }

  function goToCheckoutScreen(){
    const addonAmount = Math.round(bookingInfo.addonAmount || 0);
    const totalFare = Math.round((bookingInfo.offerPrice || bookingInfo.finalAmount || 0) + addonAmount);
    const originalFare = Math.round((bookingInfo.originalPrice || (totalFare - addonAmount)) + addonAmount);
    const offPct = originalFare > 0 ? Math.round(((originalFare - totalFare) / originalFare) * 100) : 0;
    document.getElementById('demoModeBanner').style.display = PAYMENT_CONFIG.demoMode ? 'inline-flex' : 'none';
    document.getElementById('checkoutRoute').textContent = `${bookingInfo.from || 'Pickup'} → ${bookingInfo.to || 'Drop'}`;
    document.getElementById('checkoutDateTime').textContent = `${bookingInfo.dateISO || '—'}, ${bookingInfo.timeStr || '—'}`;
    document.getElementById('checkoutCabName').textContent = bookingInfo.cabName || 'Selected cab';
    document.getElementById('checkoutCarType').textContent = bookingInfo.cabType || 'Cab';
    document.getElementById('checkoutTripType').textContent = bookingInfo.tripType || '—';
    document.getElementById('checkoutOriginalAmount').textContent = formatFareAmount(originalFare);
    document.getElementById('checkoutAmount').textContent = formatFareAmount(totalFare);
    document.getElementById('checkoutFareOff').textContent = `${offPct}% OFF`;
    document.getElementById('checkoutBase').textContent = formatFareAmount(Math.round(bookingInfo.fare || totalFare * .7058));
    document.getElementById('checkoutDriver').textContent = formatFareAmount(Math.round(bookingInfo.driverAllowance || totalFare * .2466));
    document.getElementById('checkoutGst').textContent = formatFareAmount(Math.round(bookingInfo.gst || totalFare * .0476));
    document.getElementById('checkoutAddons').textContent = formatFareAmount(addonAmount);
    document.getElementById('checkoutTotal').textContent = formatFareAmount(totalFare);
    document.getElementById('checkoutFareBreakdown').classList.remove('open');
    document.getElementById('checkoutFareToggle').setAttribute('aria-expanded', 'false');
    bookingInfo.preferredPaymentMethod = getSelectedCheckoutMethod();
    document.getElementById('paymentStickyBar').style.display = 'none';
    setGatewayButtonMode(pendingRazorpayResponse ? 'verify' : 'pay');
    if(pendingRazorpayResponse){
      setCheckoutStatus('Payment response was received but verification is pending. Do not pay again; retry verification.', 'error');
    } else {
      setCheckoutStatus('', '');
    }
    showScreen('checkoutScreen');
  }

  function renderVerifiedConfirmation(verification, razorpayResponse, isDemoPayment = false){
    const bookedAt = new Date();
    bookingInfo.paymentVerified = !isDemoPayment;
    bookingInfo.demoPaymentComplete = isDemoPayment;
    bookingInfo.paymentStatus = isDemoPayment ? 'DEMO SUCCESS · NO REAL PAYMENT' : 'Verified & Captured';
    bookingInfo.paymentId = razorpayResponse.razorpay_payment_id;
    bookingInfo.orderId = razorpayResponse.razorpay_order_id;
    bookingInfo.bookingId = verification.bookingId || bookingInfo.bookingId || generateBookingId();
    bookingInfo.bookingDate = bookedAt.toISOString().slice(0,10);
    bookingInfo.bookingTime = `${String(bookedAt.getHours()).padStart(2,'0')}:${String(bookedAt.getMinutes()).padStart(2,'0')}`;
    if(Number(verification.amountPaidRupees) > 0){
      bookingInfo.finalAmount = Number(verification.amountPaidRupees);
    }

    document.getElementById('confRoute').textContent = `${bookingInfo.from} → ${bookingInfo.to}`;
    document.getElementById('confTripType').textContent = bookingInfo.tripType;
    document.getElementById('confDistance').textContent = (bookingInfo.distanceKm != null)
      ? `${bookingInfo.distanceKm.toFixed(1)} km · ${bookingInfo.travelTimeText}`
      : '—';
    document.getElementById('confDateTime').textContent = `${bookingInfo.dateISO}, ${bookingInfo.timeStr}`;
    document.getElementById('confCabName').textContent = bookingInfo.cabName;
    document.getElementById('confBaseFare').textContent = formatFareAmount(Math.round(bookingInfo.fare || 0));
    document.getElementById('confDriverAllowance').textContent = formatFareAmount(Math.round(bookingInfo.driverAllowance || 0));
    document.getElementById('confGst').textContent = formatFareAmount(Math.round(bookingInfo.gst || 0));
    document.getElementById('confDiscount').textContent = `${formatFareAmount(Math.round(bookingInfo.discountAmount || 0))} (${Math.round(bookingInfo.discountPercent || 0)}% OFF)`;
    document.getElementById('confOfferPrice').textContent = formatFareAmount(Math.round(bookingInfo.offerPrice || 0));
    document.getElementById('confCustomer').textContent = `${bookingInfo.customerName} · ${bookingInfo.customerPhone}`;
    document.getElementById('confBookingId').textContent = bookingInfo.bookingId;
    document.getElementById('confPaymentStatus').textContent = bookingInfo.paymentStatus;
    document.getElementById('confPaymentId').textContent = bookingInfo.paymentId;
    document.getElementById('confBookingDateTime').textContent = `${bookingInfo.bookingDate}, ${bookingInfo.bookingTime}`;
    document.getElementById('confAmountPaid').textContent = formatFareAmount(Math.round(bookingInfo.finalAmount || 0));
    document.getElementById('confPaidLabel').textContent = isDemoPayment ? 'Demo Amount' : 'Final Amount Paid';
    document.getElementById('confirmationTitle').textContent = isDemoPayment
      ? 'Demo Payment Successful!'
      : 'Payment Successful & Booking Confirmed!';
    document.getElementById('confirmationSubtitle').textContent = isDemoPayment
      ? 'This is how the confirmation appears after payment. This demo did not charge any real money or create a real booking.'
      : 'Your payment has been verified and your cab is booked. Driver details will be shared shortly.';

    gatewayPaymentInProgress = false;
    pendingRazorpayResponse = null;
    document.getElementById('paymentStickyBar').style.display = 'none';
    showPaymentSuccessAnimation(()=>{
      hidePaymentProcessing();
      showScreen('confirmationScreen');
    });
  }

  function showPaymentProcessing(){
    const overlay = document.getElementById('paymentProcessingOverlay');
    overlay.querySelector('.payment-processing-card').classList.remove('success');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function hidePaymentProcessing(){
    const overlay = document.getElementById('paymentProcessingOverlay');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showPaymentSuccessAnimation(onComplete){
    const overlay = document.getElementById('paymentProcessingOverlay');
    const card = overlay.querySelector('.payment-processing-card');
    document.getElementById('paymentSuccessAmount').textContent = `${formatFareAmount(Math.round(bookingInfo.finalAmount || 0))} Paid`;
    card.classList.remove('success');
    void card.offsetWidth;
    card.classList.add('success');
    setTimeout(()=>{ if(typeof onComplete === 'function') onComplete(); }, 2300);
  }

  async function verifyAndConfirmPayment(razorpayResponse){
    pendingRazorpayResponse = razorpayResponse;
    const processingStartedAt = Date.now();
    showPaymentProcessing();
    setCheckoutStatus('Payment received. Verifying it securely…', 'success');
    try{
      const verification = await D2Api.post('/payments/verify-payment', {
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      });
      if(verification.verified !== true || verification.captured !== true){
        throw new Error(verification.message || 'Payment is not verified and captured yet. Booking is not confirmed.');
      }
      const remainingAnimationTime = Math.max(0, 3000 - (Date.now() - processingStartedAt));
      if(remainingAnimationTime) await new Promise(resolve=>setTimeout(resolve, remainingAnimationTime));
      renderVerifiedConfirmation(verification, razorpayResponse);
    } catch(err){
      hidePaymentProcessing();
      gatewayPaymentInProgress = false;
      document.getElementById('openGatewayBtn').disabled = false;
      setGatewayButtonMode('verify');
      const reason = err.message || 'Payment could not be verified.';
      setCheckoutStatus(`${reason} Do not pay again; retry verification or contact support.`, 'error');
    }
  }

  async function openSecureGateway(){
    if(PAYMENT_CONFIG.demoMode){
      const demoResponse = {
       razorpay_payment_id: 'DEMO_PAY_' + Date.now(),
       razorpay_order_id: 'DEMO_ORDER_' + Date.now()
      };

      const demoVerification = {
       bookingId: bookingInfo.bookingId || generateBookingId(),
       amountPaidRupees: Number(bookingInfo.finalAmount || 0)
      };

      gatewayPaymentInProgress = true;
      document.getElementById('openGatewayBtn').disabled = true;

      showPaymentProcessing();

      setCheckoutStatus('Demo payment processing…', 'success');

      setTimeout(()=>{
       renderVerifiedConfirmation(
         demoVerification,
         demoResponse,
         true
      );
     }, 1200);

     return;
     }
    if(gatewayPaymentInProgress) return;
    if(pendingRazorpayResponse){
      gatewayPaymentInProgress = true;
      document.getElementById('openGatewayBtn').disabled = true;
      await verifyAndConfirmPayment(pendingRazorpayResponse);
      return;
    }
    if(!bookingInfo.customerName || !bookingInfo.customerPhone || !(bookingInfo.finalAmount > 0)){
      setCheckoutStatus('Booking or payment details are incomplete. Please go back and check them.', 'error');
      return;
    }
    if(!getSelectedCheckoutMethod()){
      setCheckoutStatus('Please select a payment method first.', 'error');
      return;
    }
    if(PAYMENT_CONFIG.demoMode){
     openDemoPayment();
     return;
    }
    if(window.location.protocol === 'file:'){
      setCheckoutStatus('Live payment cannot run inside a downloaded HTML preview. Publish this form on your website and connect the Razorpay server endpoints first.', 'error');
      return;
    }
    if(typeof window.Razorpay !== 'function'){
      setCheckoutStatus('Secure payment service could not load. Check your internet connection and try again.', 'error');
      return;
    }

    gatewayPaymentInProgress = true;
    const gatewayBtn = document.getElementById('openGatewayBtn');
    gatewayBtn.disabled = true;
    setCheckoutStatus('Opening secure payment checkout…', '');

    try{
      // The server must calculate/validate the payable amount itself. Values
      // sent by the browser are context only and must never be trusted alone.
      // Only the booking id and the chosen percent are sent. The SERVER works out the amount.
      const order = await D2Api.post('/payments/create-order', {
        bookingId: bookingInfo.bookingId,
        payPercent: bookingInfo.paidPercent
      });

      const orderId = order.orderId || order.id;
      const orderAmount = Number(order.amount);
      const checkoutKey = order.keyId || PAYMENT_CONFIG.keyId;
      if(!orderId || !(orderAmount > 0) || !checkoutKey || checkoutKey.includes('REPLACE_WITH')){
        throw new Error('Razorpay setup is incomplete. Add the Key ID and connect the payment server.');
      }

      const options = {
        key: checkoutKey,
        amount: orderAmount,
        currency: order.currency || 'INR',
        name: PAYMENT_CONFIG.businessName,
        description: `${bookingInfo.paidPercent}% cab booking payment`,
        order_id: orderId,
        handler: verifyAndConfirmPayment,
        prefill: {
          name: bookingInfo.customerName,
          contact: bookingInfo.customerPhone,
          email: bookingInfo.customerEmail || ''
        },
        notes: {
          cab: bookingInfo.cabName || '',
          route: `${bookingInfo.from || ''} to ${bookingInfo.to || ''}`,
          preferred_method: bookingInfo.preferredPaymentMethod || 'upi'
        },
        config: getRazorpayMethodConfig(bookingInfo.preferredPaymentMethod || 'upi'),
        theme: { color: PAYMENT_CONFIG.themeColor },
        modal: {
          ondismiss: function(){
            gatewayPaymentInProgress = false;
            gatewayBtn.disabled = false;
            setGatewayButtonMode('pay');
            setCheckoutStatus('Payment was cancelled. Your booking is not confirmed.', 'error');
          }
        }
      };

      const gateway = new Razorpay(options);
      gateway.on('payment.failed', function(response){
        gatewayPaymentInProgress = false;
        gatewayBtn.disabled = false;
        setGatewayButtonMode('pay');
        const reason = response && response.error && response.error.description;
        setCheckoutStatus((reason || 'Payment failed.') + ' Booking is not confirmed. Please try again.', 'error');
      });
      setCheckoutStatus('', '');
      gateway.open();
    } catch(err){
      gatewayPaymentInProgress = false;
      gatewayBtn.disabled = false;
      setGatewayButtonMode('pay');
      setCheckoutStatus(err.message || 'Unable to start payment. Booking is not confirmed.', 'error');
    }
  }

  document.getElementById('openGatewayBtn').addEventListener('click', openSecureGateway);

  function toggleCheckoutMethod(methodBox){
      const input = methodBox.querySelector('input[name="checkoutMethod"]');
      const wasChecked = input.checked;
      document.querySelectorAll('.checkout-method').forEach(box=>{
        box.classList.remove('selected');
        box.querySelector('input[name="checkoutMethod"]').checked = false;
      });
      input.checked = !wasChecked;
      methodBox.classList.toggle('selected', input.checked);
      input.dispatchEvent(new Event('change', { bubbles:true }));
  }
  document.querySelectorAll('.checkout-method').forEach(methodBox=>{
    let lastPointerToggle = 0;
    methodBox.addEventListener('pointerup', event=>{
      event.preventDefault();
      lastPointerToggle = Date.now();
      toggleCheckoutMethod(methodBox);
    });
    methodBox.addEventListener('click', event=>{
      event.preventDefault();
      if(Date.now() - lastPointerToggle < 500) return;
      toggleCheckoutMethod(methodBox);
    });
  });
  document.querySelectorAll('input[name="checkoutMethod"]').forEach(input=>{
    input.addEventListener('change', ()=>{
      bookingInfo.preferredPaymentMethod = getSelectedCheckoutMethod();
      if(!pendingRazorpayResponse) setGatewayButtonMode('pay');
      setCheckoutStatus('', '');
    });
  });

  function collectAdditionalRequests(){
    return Array.from(document.querySelectorAll('input[name="addon"]:checked')).map(input=>{
      const card = input.closest('.addon-chip');
      const title = card && card.querySelector('.addon-chip-title');
      return title ? title.textContent.replace(/\+\s*₹[\d,]+/g, '').trim() : input.value;
    });
  }

  function validCustomerEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function makePreviewBookingId(){
    return `D2C-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  }

  function showPendingApproval(bookingId, previewMode){
    document.getElementById('pendingBookingId').textContent = bookingId || 'Pending';
    document.getElementById('pendingDemoControls').style.display = previewMode ? 'block' : 'none';
    document.getElementById('paymentStickyBar').style.display = 'none';
    showScreen('pendingApprovalScreen');
  }

  function finishRequestSubmission(){
    const button = document.getElementById('finalPayBtn');
    button.disabled = false;
    button.innerHTML = button.dataset.originalHtml || 'REQUEST BOOKING';
  }

  function showRequestError(message){
    const custError = document.getElementById('custError');
    custError.textContent = message;
    custError.classList.add('show');
  }

  // Only facts go to the server. The server recalculates distance, service type, fare and add-on prices itself.
 function buildBookingPayload(){
   const isRound = bookingInfo.tripType === 'ROUND TRIP';

   const fromInput = document.getElementById('fromInput');
   const toInput = document.getElementById('toInput');

   const pickupLat =
    Number.isFinite(Number(bookingInfo.fromLat)) &&
    Number(bookingInfo.fromLat) !== 0
      ? Number(bookingInfo.fromLat)
      : Number(fromInput?.dataset.lat);

     console.log("FROM DATASET:", fromInput?.dataset);
     console.log("BOOKING INFO:", bookingInfo.fromLat, bookingInfo.fromLon, bookingInfo.toLat, bookingInfo.toLon);
   const pickupLon =
    Number.isFinite(Number(bookingInfo.fromLon)) &&
    Number(bookingInfo.fromLon) !== 0
      ? Number(bookingInfo.fromLon)
      : Number(fromInput?.dataset.lon);

   const dropLat =
    Number.isFinite(Number(bookingInfo.toLat)) &&
    Number(bookingInfo.toLat) !== 0
      ? Number(bookingInfo.toLat)
      : Number(toInput?.dataset.lat);

   const dropLon =
    Number.isFinite(Number(bookingInfo.toLon)) &&
    Number(bookingInfo.toLon) !== 0
      ? Number(bookingInfo.toLon)
      : Number(toInput?.dataset.lon);

   // Neither bookingInfo nor the input's dataset had a real coordinate for
   // this point (both were empty/invalid, so the fallbacks above produced
   // NaN). Sending NaN would silently become `null` over JSON and the
   // backend would treat it as (0,0) — surface this to the caller instead
   // so the user is told to pick a real suggestion.
   const pickupCoordsValid = Number.isFinite(pickupLat) && Number.isFinite(pickupLon) && !(pickupLat === 0 && pickupLon === 0);
   const dropCoordsValid = Number.isFinite(dropLat) && Number.isFinite(dropLon) && !(dropLat === 0 && dropLon === 0);
   if(!pickupCoordsValid || !dropCoordsValid){
     const err = new Error('Please re-select your pickup and drop locations from the suggestions before booking.');
     err.code = 'INVALID_COORDS';
     throw err;
   }

   return {
    cabKey: bookingInfo.cabKey,
    tripType: isRound ? 'round_trip' : 'one_way',

    pickup: {
      address: bookingInfo.from,
      latitude: pickupLat,
      longitude: pickupLon
    },

    drop: {
      address: bookingInfo.to,
      latitude: dropLat,
      longitude: dropLon
    },

    journeyDate: bookingInfo.dateISO,
    journeyTime: bookingInfo.timeStr,

    returnDate: isRound ? bookingInfo.returnDateISO : undefined,
    returnTime: isRound ? bookingInfo.returnTimeStr : undefined,

    addons: bookingInfo.addons || [],
    payPercent: bookingInfo.paidPercent,

     customerDetails: {
      name: bookingInfo.customerName,
      phone: bookingInfo.customerPhone,
      email: bookingInfo.customerEmail,
      gender: bookingInfo.customerGender || ''
     }
   };
  }
  async function submitBookingRequest(){
    const button = document.getElementById('finalPayBtn');
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = 'SENDING REQUEST…';

    try {
      const result = await D2Api.post('/bookings', buildBookingPayload());
      bookingInfo.bookingId = result.booking.bookingId;
      finishRequestSubmission();
      showPendingApproval(result.booking.bookingId, false);
    } catch(error) {
      finishRequestSubmission();
      const message = error.code === 'INVALID_COORDS'
        ? error.message
        : `${error.message || 'Unable to send request.'} Please try again.`;
      showRequestError(message);
    }
  }

  document.getElementById('finalPayBtn').addEventListener('click', function(){
    if(!(window.D2Auth && window.D2Auth.getUser())){
      showRequestError('Please log in or sign up to request your booking.');
      if(window.D2Auth) window.D2Auth.openLogin();
      return;
    }
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const custError = document.getElementById('custError');

    if(!name || !/^\d{10}$/.test(phone) || !validCustomerEmail(email)){
      custError.textContent = 'Please enter your name, a valid 10-digit mobile number and a valid email address.';
      custError.classList.add('show');
      return;
    }
    custError.classList.remove('show');

    // Save customer data, but keep the booking PENDING until the gateway and
    // the server both confirm that payment was actually received.
    bookingInfo.customerName = name;
    bookingInfo.customerPhone = phone;
    bookingInfo.customerEmail = email;
    bookingInfo.customerGender = (document.querySelector('input[name="gender"]:checked') || {}).value || '';
    bookingInfo.paymentVerified = false;
    bookingInfo.paymentStatus = 'Pending';
    bookingInfo.paymentId = null;
    bookingInfo.orderId = null;

    submitBookingRequest();
  });

  // Customer pays AFTER admin approval: My Bookings -> "Pay now" opens  /?pay=<bookingId>
  async function restoreBookingForPayment(){
    const ref = new URLSearchParams(window.location.search).get('pay');
    if(!ref || !window.D2Auth) return;
    await window.D2Auth.ready;
    if(!window.D2Auth.getUser()){
      showToast('Please log in to pay for your booking.');
      window.D2Auth.openLogin();
      window.D2Auth.onChange(user=>{ if(user) restoreBookingForPayment(); });
      return;
    }
    try{
      const { booking: b } = await D2Api.get('/bookings/' + encodeURIComponent(ref));
      if(!['CONFIRMED','DRIVER_ASSIGNED','DRIVER_ON_THE_WAY','TRIP_STARTED'].includes(b.bookingStatus)){
        showToast('This booking is not ready for payment yet.');
        return;
      }
      if(b.balanceDue <= 0){
        showToast('This booking is already fully paid.');
        return;
      }
      const pct = b.paidAmount > 0 ? 100 : b.payPercent;
      const payNow = pct === 100 ? b.balanceDue : Math.round(b.fare.finalAmount * pct / 100);
      const addon = b.fare.addonAmount || 0;
      bookingInfo = {
        ...bookingInfo,
        bookingId: b.bookingId,
        from: b.pickup.address,
        to: b.drop.address,
        tripType: b.tripType === 'round_trip' ? 'ROUND TRIP' : 'ONE WAY',
        dateISO: String(b.journeyDate).slice(0,10),
        timeStr: b.journeyTime,
        cabName: b.cabId && b.cabId.name,
        cabType: b.cabId && b.cabId.category,
        distanceKm: b.fare.distanceKm,
        travelTimeText: '—',
        fare: b.fare.baseFare,
        driverAllowance: b.fare.driverAllowance,
        gst: b.fare.gst,
        discountAmount: b.fare.discountAmount,
        discountPercent: b.fare.originalAmount > 0 ? Math.round(b.fare.discountAmount / b.fare.originalAmount * 100) : 0,
        originalPrice: b.fare.originalAmount - addon,
        offerPrice: b.fare.finalAmount - addon,
        addonAmount: addon,
        addons: b.addons || [],
        paidPercent: pct,
        finalAmount: payNow,
        customerName: b.customerDetails.name,
        customerPhone: b.customerDetails.phone,
        customerEmail: b.customerDetails.email
      };
      goToCheckoutScreen();
    } catch(err){
      showToast(err.message || 'Unable to open this booking.');
    }
  }
  restoreBookingForPayment();

  // Show the latest per-km rates (display text only) and pre-fill the customer's details.
  D2Api.get('/cabs').then(r=>{
    (r.cabs || []).forEach(c=>{ CAB_PRICING_CONFIG[c.key] = c.pricing; });
  }).catch(()=>{});
  if(window.D2Auth){
    window.D2Auth.ready.then(()=>{
      const u = window.D2Auth.getUser();
      if(!u) return;
      const n = document.getElementById('custName'), p = document.getElementById('custPhone'), e = document.getElementById('custEmail');
      if(n && !n.value) n.value = u.name || '';
      if(p && !p.value) p.value = u.phone || '';
      if(e && !e.value) e.value = u.email || '';
    });
  }

  document.getElementById('bookAnotherBtn').addEventListener('click', function(){
    showScreen('homeScreen');
  });

  document.getElementById('exploreBtn').addEventListener('click', ()=>{
    const from = document.getElementById('fromInput').value.trim();
    const to = document.getElementById('toInput').value.trim();
    const locError = document.getElementById('locError');
    const dateError = document.getElementById('dateError');

    let valid = true;
    if(!from || !to){
      locError.classList.add('show');
      valid = false;
    } else {
      locError.classList.remove('show');
    }

    const chosen = tripStartData.chosen ? new Date(tripStartData.chosen) : new Date(Date.now() + 60*60*1000);
    if(chosen < new Date()){
      dateError.classList.add('show');
      valid = false;
    } else {
      dateError.classList.remove('show');
    }

    if(!valid) return;

    const isRound = document.querySelector('#tripToggle button.active').dataset.trip === 'round';
    const tripType = isRound ? 'Round Trip' : 'One Way';

    if(isRound){
      const endChosen = tripEndField.dataset.chosen ? new Date(tripEndField.dataset.chosen) : chosen;
      if(endChosen <= chosen){
        dateError.textContent = "Trip end date and time must be after trip start.";
        dateError.classList.add('show');
        return;
      } else {
        dateError.textContent = "Trip start can't be in the past.";
      }
    }

    document.getElementById('routeLine').textContent = `${from} → ${to}`;
    const baseTimeLine = isRound
      ? `${tripType} · ${dtDateDisplay.textContent}, ${dtTimeDisplay.textContent} → ${endDateDisplay.textContent}, ${endTimeDisplay.textContent}`
      : `${tripType} · ${dtDateDisplay.textContent}, ${dtTimeDisplay.textContent}`;
    const timeLineEl = document.getElementById('timeLine');
    timeLineEl.textContent = baseTimeLine;
    timeLineEl.dataset.base = baseTimeLine;

    // Single source of truth for every screen. Only reset (and therefore
    // trigger recalculation of distance/fare below) when pickup, destination
    // or trip type actually changed from the last time they were resolved.
    // Simply going Back and pressing "Explore Cabs" again with the same
    // route/trip-type must NOT lose the already-selected cab, the already
    // calculated fare, or the already-fetched distance/travel time/map data.
    // Round trip: return date/time, and how many days (changes the driver allowance).
    const returnChosen = isRound ? (tripEndField.dataset.chosen ? new Date(tripEndField.dataset.chosen) : chosen) : null;
    const returnDateISO = returnChosen ? localDateISO(returnChosen) : null;
    const returnTimeStr = returnChosen
      ? `${String(returnChosen.getHours()).padStart(2,'0')}:${String(returnChosen.getMinutes()).padStart(2,'0')}`
      : null;
    const quoteDaysNow = isRound ? daysBetweenISO(localDateISO(chosen), returnDateISO) : 1;
    const newTripTypeUpper = tripType.toUpperCase();
    const sameTrip = bookingInfo.from === from &&
                      bookingInfo.to === to &&
                      bookingInfo.tripType === newTripTypeUpper &&
                      bookingInfo.distanceKm != null &&
                      bookingInfo.quoteDays === quoteDaysNow;

    if(sameTrip){
      // Route/trip-type unchanged: keep every calculated field (distanceKm,
      // travelTimeText, autoTripType, selected cab, fare breakdown, etc.)
      // Just refresh the date/time portion of the single source of truth.
      bookingInfo.dateISO = localDateISO(chosen);
      bookingInfo.timeStr = `${String(chosen.getHours()).padStart(2,'0')}:${String(chosen.getMinutes()).padStart(2,'0')}`;
      window.needsRecalc = false;
    } else {
      const oldFromLat = bookingInfo.fromLat;
      const oldFromLon = bookingInfo.fromLon;
      const oldToLat = bookingInfo.toLat;
      const oldToLon = bookingInfo.toLon;
      bookingInfo = {
        tripType: newTripTypeUpper,
        from, to,  
        fromLat: oldFromLat,
        fromLon: oldFromLon,
        toLat: oldToLat,
        toLon: oldToLon,
        dateISO: localDateISO(chosen),
        timeStr: `${String(chosen.getHours()).padStart(2,'0')}:${String(chosen.getMinutes()).padStart(2,'0')}`,
        autoTripType: null,
        distanceKm: null,
        travelTimeText: null,
        cabKey: null,
        cabName: null,
        fare: null,
        driverAllowance: null,
        gst: null,
        discountAmount: null,
        discountPercent: null,
        originalPrice: null,
        offerPrice: null,
        finalAmount: null,
        customerName: null,
        customerPhone: null,
        bookingId: null,
        bookingDate: null,
        bookingTime: null
      };
      window.needsRecalc = true;
    }
    bookingInfo.returnDateISO = returnDateISO;
    bookingInfo.returnTimeStr = returnTimeStr;
    if(quoteDaysNow !== bookingInfo.quoteDays) window.needsRecalc = true;

    showScreen('resultsScreen');
  });

  // =========================================================================
  // PRICING ENGINE
  // Single source of truth for all fare calculations across every trip type.
  // Nothing in the UI is touched from here — these are pure calculation
  // functions only, ready to be wired up in a later step.
  // =========================================================================

  // ---- Trip type identifiers used throughout the engine ----
  const TRIP_TYPES = {
    LOCAL: 'local',
    OUTSTATION_ONE_WAY: 'outstation-oneway',
    OUTSTATION_ROUND_TRIP: 'outstation-roundtrip',
    AIRPORT: 'airport'
  };

  // =========================================================================
  // AUTOMATIC TRIP DETECTION
  // Classifies a trip as Local / Outstation / Airport purely from pickup and
  // drop coordinates (plus labels, for the airport name fallback). Pure
  // calculation only, does not touch the UI.
  // =========================================================================
  const INDORE_CITY_RADIUS_KM = 20;   // pickup/drop within this radius of Indore center counts as "inside Indore city"
  const INDORE_AIRPORT_LAT = 22.7218; // Devi Ahilyabai Holkar Airport, Indore
  const INDORE_AIRPORT_LON = 75.8011;
  const INDORE_AIRPORT_RADIUS_KM = 3; // geo-proximity match for the airport

  function haversineKm(lat1, lon1, lat2, lon2){
    if(![lat1, lon1, lat2, lon2].every(isFinite)) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function isWithinIndoreCity(lat, lon){
    return haversineKm(lat, lon, INDORE_LAT, INDORE_LON) <= INDORE_CITY_RADIUS_KM;
  }

  function isIndoreAirport(label, lat, lon){
    const nameMatch = /indore\s*airport|devi\s*ahilyabai/i.test(label || '');
    const geoMatch = haversineKm(lat, lon, INDORE_AIRPORT_LAT, INDORE_AIRPORT_LON) <= INDORE_AIRPORT_RADIUS_KM;
    return nameMatch || geoMatch;
  }

  /**
   * detectTripType(fromLabel, fromLat, fromLon, toLabel, toLat, toLon, isRoundTrip)
   * Priority order: Airport > Local (both ends inside Indore city) > Outstation.
   */
  function detectTripType(fromLabel, fromLat, fromLon, toLabel, toLat, toLon, isRoundTrip){
    if(isIndoreAirport(fromLabel, fromLat, fromLon) || isIndoreAirport(toLabel, toLat, toLon)){
      return TRIP_TYPES.AIRPORT;
    }
    if(isWithinIndoreCity(fromLat, fromLon) && isWithinIndoreCity(toLat, toLon)){
      return TRIP_TYPES.LOCAL;
    }
    return isRoundTrip ? TRIP_TYPES.OUTSTATION_ROUND_TRIP : TRIP_TYPES.OUTSTATION_ONE_WAY;
  }

  // ---- Auto-correct the manually-selected tab if it doesn't match the
  // ---- detected trip type for the current pickup/drop locations. Reuses
  // ---- the existing tab-click logic (via .click()) so no new UI is added.
  function tripTypeToTabKey(tripType){
    switch(tripType){
      case TRIP_TYPES.LOCAL: return 'local';
      case TRIP_TYPES.AIRPORT: return 'airport';
      default: return 'outstation';
    }
  }

  function getAutoDetectedTabKey(){
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    const fromLat = parseFloat(fromInput.dataset.lat);
    const fromLon = parseFloat(fromInput.dataset.lon);
    const toLat = parseFloat(toInput.dataset.lat);
    const toLon = parseFloat(toInput.dataset.lon);
    if(!isFinite(fromLat) || !isFinite(fromLon) || !isFinite(toLat) || !isFinite(toLon)) return null;

    const activeTripBtn = document.querySelector('#tripToggle button.active');
    const isRound = activeTripBtn ? activeTripBtn.dataset.trip === 'round' : false;
    const tripType = detectTripType(
      fromInput.value.trim(), fromLat, fromLon,
      toInput.value.trim(), toLat, toLon,
      isRound
    );
    return tripTypeToTabKey(tripType);
  }

  function enforceCorrectTripType(){
    // Keep the customer's manually selected Outstation / Local / Airport tab.
    // Location selection must never override or lock the chosen service type.
    return;
  }

  // Fares are calculated by the SERVER (POST /api/fare/quote). The rates below are ONLY used for the
  // per-km text on the cab details screen and are refreshed from GET /api/cabs when the page loads.

  // ---- Swift Dzire / Honda Amaze / Hyundai Aura share identical pricing ----
  const DZIRE_CLASS_PRICING = {
    local:      { baseFare: 180, perKm: 14 },
    outstation: { minimumFare: 1400, perKm: 14, driverAllowance: 220 },
    airport:    { baseFare: 220, perKm: 15 }
  };

  // ---- ONE configuration object — every cab's rates live here only ----
  const CAB_PRICING_CONFIG = {
    wagonr: {
      local:      { baseFare: 150, perKm: 13 },
      outstation: { minimumFare: 1200, perKm: 13, driverAllowance: 200 },
      airport:    { baseFare: 200, perKm: 14 }
    },
    dzire: DZIRE_CLASS_PRICING,
    amaze: DZIRE_CLASS_PRICING,
    aura:  DZIRE_CLASS_PRICING,
    ertiga: {
      local:      { baseFare: 250, perKm: 18 },
      outstation: { minimumFare: 1600, perKm: 18, driverAllowance: 250 },
      airport:    { baseFare: 300, perKm: 19 }
    },
    crysta: {
      local:      { baseFare: 350, perKm: 22 },
      outstation: { minimumFare: 2200, perKm: 22, driverAllowance: 300 },
      airport:    { baseFare: 450, perKm: 23 }
    }
  };

  // ---- Recalculate Distance / Fare / Original Price / Discount / GST /
  // ---- Driver Allowance / Final Amount for every cab once a trip type has
  // ---- been auto-detected, and keep the results, confirm and payment
  // ---- screens synchronized. No new UI is added — only the existing
  // ---- price fields (already present in the markup) are updated.
  window.fareBreakdownByCab = {};

  function applyFareRecalculation(quoteData){
    if(!quoteData || !Array.isArray(quoteData.quotes)) return;
    const offered = new Set();

    quoteData.quotes.forEach(q=>{
      const cabKey = q.cabKey;
      offered.add(cabKey);
      const breakdown = {
        fare: q.fare,
        driverAllowance: q.driverAllowance,
        gst: q.gst,
        finalFare: q.finalAmount,
        originalPrice: q.originalAmount,
        discount: { amount: q.discountAmount, percent: q.discountPercent }
      };
      window.fareBreakdownByCab[cabKey] = breakdown;

      const card = document.querySelector(`.cab-card[data-cab="${cabKey}"]`);
      if(!card) return;
      card.style.display = '';

      const finalFare = Math.round(breakdown.finalFare);
      const originalPrice = Math.round(breakdown.originalPrice);
      const discountPct = Math.round(breakdown.discount.percent);

      const origEl = card.querySelector('.cab-original-price');
      const priceEl = card.querySelector('.cab-price');
      const discEl = card.querySelector('.cab-discount-tag');
      const btnEl = card.querySelector('.cab-select-btn');

      if(origEl) origEl.textContent = formatFareAmount(originalPrice);
      if(priceEl) priceEl.textContent = formatFareAmount(finalFare);
      if(discEl) discEl.textContent = discountPct + '% OFF';
      if(btnEl) btnEl.dataset.cabPrice = formatFareAmount(finalFare);
    });

    // A cab that admin has disabled is not in the quote: hide its card.
    document.querySelectorAll('.cab-card[data-cab]').forEach(card=>{
      if(!offered.has(card.dataset.cab)) card.style.display = 'none';
    });

    // If a cab is already selected/confirmed/paid-for, refresh those screens too
    const selectedCard = document.querySelector('.cab-card.selected');
    const selectedKey = selectedCard ? selectedCard.dataset.cab : null;

    const confirmBookBtn = document.getElementById('confirmBookBtn');
    const confirmScreen = document.getElementById('confirmScreen');
    if(selectedKey && confirmBookBtn && confirmBookBtn.dataset.cabKey === selectedKey &&
       confirmScreen && confirmScreen.style.display !== 'none'){
      confirmBookBtn.dataset.cabPrice = document.querySelector(`.cab-card[data-cab="${selectedKey}"] .cab-select-btn`).dataset.cabPrice;
      updateConfirmCarDetails(selectedKey);
    }

    const paymentScreen = document.getElementById('paymentScreen');
    if(selectedKey && paymentScreen && paymentScreen.dataset.cabKey === selectedKey &&
       paymentScreen.style.display !== 'none'){
      paymentScreen.dataset.cabPrice = document.querySelector(`.cab-card[data-cab="${selectedKey}"] .cab-select-btn`).dataset.cabPrice;
      updateStickyFare();
    }
  }

  // ---- Step 2: prices come from the SERVER (POST /api/fare/quote) ----
  // The server finds the road distance, decides Local / Airport / Outstation and prices every cab.
  // The browser no longer calculates any money.
  let quoteSeq = 0;
  function engineKeyFor(serviceType, tripType){
    if(serviceType === 'local') return TRIP_TYPES.LOCAL;
    if(serviceType === 'airport') return TRIP_TYPES.AIRPORT;
    return tripType === 'round_trip' ? TRIP_TYPES.OUTSTATION_ROUND_TRIP : TRIP_TYPES.OUTSTATION_ONE_WAY;
  }

  document.getElementById('exploreBtn').addEventListener('click', async ()=>{
    // Same search as last time (user pressed Back and Explore again): keep everything.
    if(window.needsRecalc === false){
      return;
    }

    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    const fromLat = parseFloat(fromInput.dataset.lat);
    const fromLon = parseFloat(fromInput.dataset.lon);
    const toLat = parseFloat(toInput.dataset.lat);
    const toLon = parseFloat(toInput.dataset.lon);

    if(!isFinite(fromLat) || !isFinite(fromLon) || !isFinite(toLat) || !isFinite(toLon)){
      showToast('Please choose pickup and drop from the location suggestions to see prices.');
      return;
    }

    const isRound = document.querySelector('#tripToggle button.active').dataset.trip === 'round';
    const seq = ++quoteSeq;

    try{
      const q = await D2Api.post('/fare/quote', {
        tripType: isRound ? 'round_trip' : 'one_way',
        pickup: { latitude: fromLat, longitude: fromLon },
        drop: { latitude: toLat, longitude: toLon },
        journeyDate: bookingInfo.dateISO,
        returnDate: isRound ? bookingInfo.returnDateISO : undefined
      });
      if(seq !== quoteSeq) return; // a newer search replaced this one

      const totalMinutes = Math.round(q.durationMin);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      bookingInfo.fromLat = fromLat;
      bookingInfo.fromLon = fromLon;
      bookingInfo.toLat = toLat;
      bookingInfo.toLon = toLon;
      bookingInfo.autoTripType = engineKeyFor(q.serviceType, q.tripType);
      bookingInfo.distanceKm = q.distanceKm;
      bookingInfo.travelTimeText = `${hours}h ${minutes}m`;
      bookingInfo.quoteDays = q.days;

      const timeLineEl = document.getElementById('timeLine');
      const base = timeLineEl.dataset.base || timeLineEl.textContent;
      timeLineEl.textContent = `${base} · ${q.distanceKm.toFixed(1)} km · ${bookingInfo.travelTimeText}`;

      applyFareRecalculation(q);
    } catch(err){
      console.error('Fare quote failed:', err);
      showToast(err.message || 'Could not calculate prices. Please try again.');
    }
  });

  function goBackToForm(){
    document.getElementById('paymentStickyBar').style.display = 'none';
    showScreen('homeScreen');
  }
  document.getElementById('editBookingBtn').addEventListener('click', goBackToForm);

  // ---- Carousel rotation for the info box (reusable so it can run on cloned copies too) ----
  function initInfoCarousel(wrapEl){
    if(!wrapEl) return;
    const carousel = wrapEl.querySelector('.confirm-info-carousel');
    let index = 0;
    let autoPlayTimer;
    let touchStartX = 0;

    function update(instant){
      const items = wrapEl.querySelectorAll('.carousel-item');
      const dots = wrapEl.querySelectorAll('.dot');
      items.forEach(item => item.classList.remove('active','animate'));
      dots.forEach(dot => dot.classList.remove('active'));
      items[index].classList.add('active');
      if(!instant) items[index].classList.add('animate');
      dots[index].classList.add('active');
      carousel.style.height = items[index].offsetHeight + 'px';
    }

    function resetAutoPlay(){
      clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(()=>{
        index = (index + 1) % 3;
        update();
      }, 5500);
    }

    function handleSwipe(direction){
      if(direction === 'left') index = (index + 1) % 3;
      if(direction === 'right') index = (index - 1 + 3) % 3;
      update();
      resetAutoPlay();
    }

    carousel.addEventListener('touchstart', (e)=>{
      touchStartX = e.touches[0].clientX;
    }, { passive:true });

    carousel.addEventListener('touchend', (e)=>{
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if(Math.abs(diff) > 50){
        if(diff > 0) handleSwipe('left');
        else handleSwipe('right');
      }
    }, { passive:true });

    wrapEl.querySelectorAll('.dot').forEach(dot => {
      dot.addEventListener('click', ()=>{
        index = parseInt(dot.dataset.index);
        update();
        resetAutoPlay();
      });
    });

    update(true);
    resetAutoPlay();

    // exposed so a fresh clone can stop this instance's timer before being removed
    wrapEl._stopCarousel = ()=>clearInterval(autoPlayTimer);
    // Re-measure immediately after a previously hidden screen becomes visible.
    wrapEl._refreshCarousel = ()=>update(true);
  }

  // Start the carousel on the 3rd/confirm page
  initInfoCarousel(document.getElementById('infoCarouselWrap'));

  if(new URLSearchParams(window.location.search).get('animationOnly') === '1'){
    const runAnimationPreview = ()=>{
      showPaymentProcessing();
      setTimeout(()=>{
        showPaymentSuccessAnimation(()=>{
          document.querySelector('.payment-processing-card').classList.remove('success');
          setTimeout(runAnimationPreview, 650);
        });
      }, 3200);
    };
    runAnimationPreview();
  }

/* ---- next script block ---- */

(() => {
  const progressLabels=['Trip Details','Select Cab','Your Details','Payment'];
  const screens={ resultsScreen:2, confirmScreen:2, paymentScreen:3, checkoutScreen:4 };
  const makeProgress=(step)=>{
    const wrap=document.createElement('div');
    wrap.className='booking-progress'; wrap.dataset.step=step;
    wrap.setAttribute('aria-label',`Booking progress: step ${step} of 4`);
    const track=document.createElement('div'); track.className='booking-progress-track';
    const fill=document.createElement('div'); fill.className='booking-progress-fill'; track.appendChild(fill);
    progressLabels.forEach((label,i)=>{
      const item=document.createElement('div');
      item.className='booking-progress-item '+(i+1<step?'done':i+1===step?'active':'');
      item.innerHTML=`<span class="booking-progress-dot">${i+1<step?'✓':i+1}</span><span>${label}</span>`;
      track.appendChild(item);
    });
    wrap.appendChild(track); return wrap;
  };
  Object.entries(screens).forEach(([id,step])=>{
    const screen=document.getElementById(id); if(!screen || screen.querySelector('.booking-progress')) return;
    const progress=makeProgress(step);
    const back=screen.querySelector('.back-row');
    const header=screen.querySelector('.results-header');
    const checkoutHero=id==='checkoutScreen' ? screen.querySelector('.checkout-hero') : null;
    if(checkoutHero) checkoutHero.insertAdjacentElement('afterend',progress);
    else if(header) header.insertAdjacentElement('afterend',progress);
    else if(back) back.insertAdjacentElement('afterend',progress);
    else screen.prepend(progress);
    const placeAfterHeader=()=>requestAnimationFrame(()=>{
      const currentHeader=screen.querySelector('.results-header');
      const currentProgress=screen.querySelector('.booking-progress');
      if(currentHeader && currentProgress && currentHeader.nextElementSibling!==currentProgress){
        currentHeader.insertAdjacentElement('afterend',currentProgress);
      }
    });
    new MutationObserver(placeAfterHeader).observe(screen,{childList:true});
  });

  const payBtn=document.getElementById('openGatewayBtn');
  if(payBtn && !document.querySelector('.premium-reassurance')){
    const note=document.createElement('div'); note.className='premium-reassurance';
    note.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6l7-3z" stroke="currentColor" stroke-width="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Secure checkout • No payment details stored</span>';
    payBtn.insertAdjacentElement('afterend',note);
  }

  // Decode off-screen car artwork only when needed; the first visible choice stays instant.
  document.querySelectorAll('.cab-card img,.circle-avatar img').forEach((img,i)=>{
    img.decoding='async';
    if(i>1) img.loading='lazy';
  });

  const syncCabButtons=()=>{
    document.querySelectorAll('.cab-card').forEach(card=>{
      const btn=card.querySelector('.cab-select-btn'); if(!btn) return;
      btn.textContent='Select';
      btn.setAttribute('aria-pressed',card.classList.contains('selected')?'true':'false');
    });
  };
  document.querySelectorAll('.cab-card,.cab-select-btn').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(syncCabButtons)));
  syncCabButtons();
})();

/* ---- next script block ---- */

(function(){
  function mountHelpCab(){
    const target=document.querySelector('.d2-car-mark');
    const source=document.querySelector('.d2-cab-art img');
    if(!target||!source||target.querySelector('.d2-support-agent')) return;
    const cab=source.cloneNode(false);
    cab.removeAttribute('class');
    cab.src=source.getAttribute('src')||source.src;
    cab.alt='D2cabs cab';
    cab.loading='eager';
    cab.fetchPriority='high';
    cab.decoding='async';
    target.textContent='';
    target.appendChild(cab);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountHelpCab,{once:true});
  else mountHelpCab();
  window.addEventListener('load',mountHelpCab,{once:true});
})();

/* ---- next script block ---- */

(() => {
  const rail=document.querySelector('#d2Homepage .d2-cab-scroll');
  if(!rail || rail.dataset.dotsReady==='true') return;
  rail.dataset.dotsReady='true';

  const cards=[...rail.querySelectorAll('.d2-cab')];
  const dots=rail.nextElementSibling;
  if(!dots || !dots.classList.contains('d2-cab-dots')) return;
  const buttons=[...dots.querySelectorAll('.d2-cab-dot')];
  buttons.forEach((dot,index)=>{
    const card=cards[index];
    if(!card) return;
    dot.addEventListener('click',()=>{
      const target=Math.max(0,card.offsetLeft-rail.offsetLeft);
      rail.scrollTo({left:target,behavior:'smooth'});
    });
  });

  const storageKey='d2cabsWishlist';
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem(storageKey)||'[]')}catch(_){saved=[]}
  cards.forEach(card=>{
    const heart=card.querySelector('.d2-wishlist');
    const name=card.querySelector('.d2-cab-name')?.textContent.trim()||'';
    if(!heart || !name) return;
    const render=()=>{
      const active=saved.includes(name);
      heart.classList.toggle('active',active);
      heart.setAttribute('aria-pressed',active?'true':'false');
      heart.setAttribute('aria-label',active?`Remove ${name} from wishlist`:`Add ${name} to wishlist`);
    };
    render();
    heart.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      saved=saved.includes(name)?saved.filter(item=>item!==name):[...saved,name];
      try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch(_){}
      render();
    });
  });

  let frame=0;
  const sync=()=>{
    frame=0;
    const railCenter=rail.scrollLeft+rail.clientWidth/2;
    let active=0,best=Infinity;
    cards.forEach((card,index)=>{
      const center=card.offsetLeft+card.offsetWidth/2;
      const distance=Math.abs(center-railCenter);
      if(distance<best){best=distance;active=index;}
    });
    buttons.forEach((dot,index)=>dot.classList.toggle('active',index===active));
  };
  rail.addEventListener('scroll',()=>{if(!frame) frame=requestAnimationFrame(sync)},{passive:true});
  window.addEventListener('resize',sync,{passive:true});
  requestAnimationFrame(sync);
})();

/* ---- next script block ---- */

(async()=>{
  const img=document.querySelector('#d2Homepage .d2-coverage-map img');
  if(!img) return;
  try{
    const packed='H4sICLaTiWoCA2luZGlhLWxhYmVsbGVkLnN2ZwDs/WuPJdeVJQh+zvwVF8ovlRgzl523mfLRmMlGAw10YQbTUzPVH0POkMhUiCTIkDKzBvPf59rZa629zcNJkanwiGgpsooKf1y/1+zYeezHevzj//Tvv39z++Pr777/6puv/+kX6WH7xe3114/ffPHV17/9p1/8t//X/7Luv7h9//bV11+8evPN16//6Rdff/OL/+mf//Yfv//jb//2drvd//jr73/1xeM//eLLt2+//dUvf/ntH7578/DNd7/95RePv3z95vXvX3/99vtfpof0y1/4yx/95Y/fvX719qs/vn785ve//+br7+dffv3934UXf/fFb/Tqf/u3f3v4tzJflI7j+OWWf5nzen/F+v1/fP321b+v1z+9X+Nzf5q3bfvl/Xf+yp/2ql/9+5uvvv7dD17M/O18dRjNNH/wb1998fbL+7ftqPP7L19/9dsv395/sPfd/uKr1//2f/vm3//pF9ttu50vu+lXr79+9es3r9dfv3r83W+/++YPX39xfwSv/+327gvv1/ir77999Xh/Rt9+9/r719/98fX8+Vf3v7jfR+q5/eKf//H3r9+++uLV21f8Db+///q4//o+lr/6f/7P/8s//+Pj46/+P99897vzZef/nT9/9etv/nC/6Purvnj81W+++e73r97+81e/f/Xb1+cw/V/uH/+Pv/RfnK95+x/fvuYb2Fvcr+ubP3x3XuIz0+WLx99/df7JL//3t1+9efO/nu/8i9sv7Z2+evvm9T//P75589Xbrx5fvbn911ff3r75ze1//fqLr17NT7UX/OMvcdn3r3Qnv+Qt/vPf/s0/ztfx3uc3Kefyix98a3vf+x9+//Y//A/nN99/+fr12znC50Xf3+31v7/95eP33//i/vK/uY/I7f97//dvfvPN12/X37z6/Vdv/uNXt//36+++ePX1q+X2/auvv1/vj+ir3/zD/UX/v7+9/8/Dm/saW3//6vvv16/Oz/4af38fil/d/u71b87/99yL7+N9n03XV/+mfPHrV/tzr3588+qr37/+Yn38ev31f9w/KP7Z/VH8l7/jL/7+x/7629/9wF/zFz/611/Nj3h896/5i5/w19/+7gf++tvfPfvX93Xz+jdfff36i+s4zf/z1//bq7evv5t/cHnZY31df5P9Zb8+l+Gr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';
    const bytes=Uint8Array.from(atob(packed),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const svg=await new Response(stream).text();
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    img.addEventListener('load',()=>{img.classList.add('is-ready');URL.revokeObjectURL(url)},{once:true});
    img.src=url;
  }catch(_){
    img.classList.add('is-ready');
  }
})();

/* ---- next script block ---- */

(()=>{
  const img=document.querySelector('#d2Homepage .d2-coverage-map img');
  if(!img) return;
  img.addEventListener('load',()=>img.classList.add('is-ready'),{once:true});
  img.src='images/img_055.svg';
})();

/* ---- next script block ---- */

(function(){
  function initD2FaqSingleOpen(){
    var root=document.getElementById('d2Homepage');
    if(!root)return;
    var items=Array.from(root.querySelectorAll('.d2-faq details'));
    items.forEach(function(item){
      item.addEventListener('toggle',function(){
        if(!item.open)return;
        items.forEach(function(other){
          if(other!==item && other.open) other.open=false;
        });
      });
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initD2FaqSingleOpen);
  }else{
    initD2FaqSingleOpen();
  }
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
    var phone = document.querySelector('.phone');
    if(!header || !phone) return;
    function apply(){
      phone.style.paddingTop = header.offsetHeight + 'px';
      phone.dataset.headerOffset = header.offsetHeight + 'px';
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