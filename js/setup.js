'use strict';

var SOURCE, SINK;
var FRAME_WIDTH, FRAME_HEIGHT;
var FPS, FPS_LABEL, DECAY, FPS_DECAY_THRESHOLD;
var FILTER_BOUNDS = {};
var VIEW_STATE = {};

var camera_constraints = {
  audio: false,
  video: {
    facingMode: 'user',
    width: { ideal: 640, max: 1024 },
    height: { ideal: 480, max: 1024 },
    // frameRate: 30,
  },
};

function reset_frame_parameters(source = SOURCE) {
  if (source.tagName == 'VIDEO') {
    FRAME_WIDTH = source.videoWidth;
    FRAME_HEIGHT = source.videoHeight;
  } else {
    FRAME_WIDTH = source.width;
    FRAME_HEIGHT = source.height;
  }

  document.querySelectorAll('.sink').forEach(canvas => {
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
  });

  filter_size_changed = true;
}

function camera_error(error) {
  console.error(`Could not access webcam`, error);

  SOURCE.failed = true;
  SOURCE.classList.toggle('hide', true);

  var parent = document.querySelector('.content');
  var dim = get_min_dim(parent);
  var fraction = 0.382;

  camera_error.element = parent = add_div(parent);
  var style = {
    color: 'var(--pink)',
    width: fraction * dim + 'px',
    height: fraction * dim + 'px',
    fontSize: fraction * dim + 'px',
    lineHeight: fraction * dim + 'px',
    opacity: 0.33,
  };
  var element = add_div(parent, style);

  element.innerHTML = '&#9785;';
  element.classList.toggle('fade_in_out_from', true);
  element.classList.toggle('timing_linear', true);
  element.classList.toggle('duration_750', true);

  var message = add_div(parent, {
    color: 'var(--pink)',
    fontSize: '2.5vh',
    lineHeight: '2.5vh',
    textAlign: 'center',
    opacity: 0.33,
  });
  message.innerHTML = `<br>Could not access webcam`;
  message.classList.toggle('fade_in_out_from', true);
  message.classList.toggle('timing_linear', true);
  message.classList.toggle('duration_750', true);
  message.style.textTransform = 'uppercase';
  message.style.fontWeight = 'bold';
}

function camera_init(mediaStream) {
  window.stream = mediaStream;

  const executor = (resolve, reject) => {
    this.onloadedmetadata = function(e) {
      if (this.loaded) return;

      this.loaded = true;
      reset_frame_parameters(this);

      loaded();
      sessionStorage.setItem('cameraGranted', true);
      console.log('camera source loaded.');
      resolve();
    };
  };
  this.srcObject = mediaStream;

  return new Promise(executor);
}

function image_init() {
  SOURCE.onload = function() {
    if (this.loaded) return;

    this.loaded = true;
    reset_frame_parameters(this);

    loaded();
    console.log('image source loaded.');
  };
  SOURCE.src = SOURCE.src;
}

function video_source_init(callback) {
  SOURCE.onloadeddata = function(e) {
    if (this.readyState < 2 || this.loaded) return;

    this.loaded = true;
    reset_frame_parameters();

    loaded();
    console.log('video source loaded.');
    if (callback) callback();
  };
  SOURCE.src = SOURCE.getAttribute('data_src');
}

function init() {
  SOURCE = document.querySelector('.source');
  SINK = document.querySelector('.sink').getContext('2d');

  heap_init();
  options_init();
  fps_init();
  pyramids_init();
  videomag_init();
  blur_init();

  var loading = document.querySelectorAll('.loading');
  loading.forEach(e => e.classList.replace('loading', 'fade_in'));
  spinner_init();
  options_pane_init();
  header_init();
  setTimeout(() => loading.forEach(e => e.classList.toggle('fade_in')), 1000);

  var delay_source_init = function() {
    document
      .querySelectorAll('.source_select > div')
      [INITIAL_SOURCE_INDEX].click();
    window.removeEventListener('scroll', delay_source_init, { passive: true });
  };

  window.addEventListener('scroll', delay_source_init, { passive: true });

  if (!SOURCE.loaded && pageYOffset > 0) {
    delay_source_init();
  }
}

function is_camera_source(source) {
  if (source)
    return source.srcObject == null && source.getAttribute('data_src') == null;
}

async function camera_permissions_toast(source) {
  if (source.loaded) return;
  if (sessionStorage.getItem('cameraGranted')) {
    console.log('camera permissions previously granted.');
    add_wait_spinner(source, 'Loading...', 0.618, {
      minWidth: '120px',
      minHeight: '120px',
    });
    return;
  }
  const parent = document.querySelector('.content');
  const toast = add_div(parent);
  toast.classList.add('toast');
  toast.innerHTML = `<div>click here to use web camera</div>`;
  const content = toast.children[0];
  content.classList.add('hoverable');

  const position_toast = () => {
    const { width, left } = parent.getBoundingClientRect();
    toast.style.setProperty('--left', `${left + width / 2}px`);
  };
  position_toast();
  window.addEventListener('resize', position_toast);

  const executor = (resolve, reject) => {
    toast.addEventListener('click', () => {
      content.classList.remove('hoverable');
      window.removeEventListener('resize', position_toast);
      resolve();
    });
  };
  return new Promise(executor);
}

async function detach_toast(resolved, fallthrough_value) {
  const toast = document.querySelector('.toast');

  if (toast) {
    const anim = toast.animate([{ opacity: '1' }, { opacity: '0' }], {
      duration: 100,
      fill: 'forwards',
      easing: 'ease-out',
    });
    toast.children[0].animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.618)' }],
      {
        duration: 100,
        fill: 'forwards',
        easing: 'ease-out',
      }
    );
  } else {
    remove_wait_spinner(document.querySelector('.spinner'));
  }

  // await new Promise(resolve => setTimeout(resolve, 50));

  if (resolved) {
    return fallthrough_value;
  } else {
    throw fallthrough_value;
  }
}

function source_init(source = SOURCE, callback) {
  if (source.loaded) {
    return;
  }

  switch (source.tagName) {
    case 'VIDEO':
      if (is_camera_source(source)) {
        camera_permissions_toast(source)
          .then(() => navigator.mediaDevices.getUserMedia(camera_constraints))
          .then(detach_toast.bind(null, true), detach_toast.bind(null, false))
          .then(camera_init.bind(source), camera_error)
          .finally(callback);
      } else {
        video_source_init(callback);
      }
      break;
    case 'IMG':
      image_init();
  }
}

function loaded() {
  if (!loaded.done) loaded.done = true;
  else {
    return;
  }

  render.id = requestAnimationFrame(render);
}

function header_init() {
  var element = document.body.querySelector('.title');
  const down_arrow = document.querySelector('.down_arrow');
  setTimeout(() => element.classList.toggle('blur_focus'), 330);

  for (const e of [element, down_arrow]) {
    e.addEventListener(
      'mouseenter',
      () => {
        down_arrow.style.animationPlayState = 'paused';

        element.classList.toggle('blur_focus');
        element.getBoundingClientRect();
        element.classList.toggle('blur_focus');
      },
      { passive: true }
    );
    e.addEventListener(
      'mouseleave',
      () => {
        down_arrow.style.animationPlayState = 'running';
      },
      { passive: true }
    );
    e.addEventListener('click', () => {
      window.scroll({ top: window.innerHeight, behavior: 'smooth' });
    });
  }
}

function spinner_init() {
  var spinnerElement = document.querySelector('.spinner');
  spinnerElement.classList.toggle('fade_out');
  setTimeout(() => spinnerElement.remove(), 1000);
}

function options_pane_init() {
  var options_lock = document.querySelector('.options_lock');
  var options = document.querySelector('.options');
  if (document.body.getBoundingClientRect().width >= 1000) {
    options_lock.classList.toggle('docked', true);
    options.classList.replace('hide', 'docked');
  } else {
    setTimeout(() => options.classList.replace('hide', 'undocked'), 1000);
  }

  window.addEventListener(
    'resize',
    () => {
      if (document.body.getBoundingClientRect().width >= 1000) {
        options_lock.classList.toggle('docked', true);
        options.classList.toggle('docked', true);
        options.classList.toggle('undocked', false);
        document
          .querySelector('.options_container')
          .classList.toggle('undocked', false);
      }
    },
    { passive: true }
  );
}

function fps_init() {
  FPS = 0;
  DECAY = get_iir_decay(1 / 4, 1 / 30); // 0.0510
  FPS_DECAY_THRESHOLD = 1000 / 5; // 5 fps => 1000/5 = 200 ms
  FPS_LABEL = document.querySelector('.fps');
  FPS_LABEL.innerHTML = FPS;
}
