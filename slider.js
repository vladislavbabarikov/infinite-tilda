window.initHeroSlider = async function(sliderType) {
  const jsonUrl = 'https://vladislavbabarikov.github.io/infinite-tilda/slider-config.json';

  let imgs = [];
  try {
    const resp = await fetch(jsonUrl, { cache: 'no-store' });
    if (!resp.ok) throw new Error(resp.statusText);
    const data = await resp.json();
    imgs = data[sliderType] ?? [];
  } catch (err) {
    console.error('Не удалось получить JSON:', err);
  }

  if (!imgs.length) {
    console.warn(`В JSON нет ключа «${sliderType}» или массив пуст — слайдер не показан`);
    document.getElementById('heroSlider').style.display = 'none';
    return;
  }

  const slider = document.getElementById('heroSlider'),
        dotsWrap = slider.querySelector('.hero-dots'),
        cnt = slider.querySelector('.hero-count'),
        prevBtn = slider.querySelector('.hero-nav.prev'),
        nextBtn = slider.querySelector('.hero-nav.next');

  let cur = 0, lock = false, startX = 0, delta = 0, drag = false;

  imgs.forEach((src, i) => {
    const s = document.createElement('div');
    s.className = 'hero-slide';
    s.style.backgroundImage = `url(${src})`;
    if (!i) s.classList.add('active');
    slider.appendChild(s);

    const d = document.createElement('div');
    d.className = 'hero-dot';
    if (!i) d.classList.add('active');
    d.onclick = () => switchTo(i);
    dotsWrap.appendChild(d);
  });

  const slides = [...slider.querySelectorAll('.hero-slide')],
        dots = [...dotsWrap.children],
        tot = slides.length;

  cnt.textContent = `1/${tot}`;

  const pos = i => i === cur ? 0 : (i < cur ? -100 : 100);
  slides.forEach((s, i) => s.style.transform = `translateX(${pos(i)}%)`);

  function switchTo(n, dirOverride = null, instant = false) {
    if (lock || n === cur) return;
    lock = true;

    const dir = dirOverride !== null ? dirOverride : (n > cur ? 1 : -1);

    slides[n].style.transform = `translateX(${dir * 100}%)`;
    void slides[n].offsetWidth;
    slides[n].classList.add('active', 'anim');
    slides[cur].classList.add('anim');

    slides[n].style.transform = 'translateX(0)';
    slides[cur].style.transform = `translateX(${-dir * 100}%)`;

    dots[cur].classList.remove('active');
    dots[n].classList.add('active');
    cnt.textContent = `${n + 1}/${tot}`;

    const after = () => {
      slides[cur].classList.remove('active', 'anim');
      slides[n].classList.remove('anim');
      cur = n;
      lock = false;
    };
    instant ? after() : setTimeout(after, 450);
  }

  prevBtn.onclick = () => switchTo((cur - 1 + tot) % tot, -1);
  nextBtn.onclick = () => switchTo((cur + 1) % tot, 1);

  const thr = 60;
  function down(e) {
    if (lock) return;
    if (e.target.closest('.hero-nav') || e.target.closest('.hero-dot')) return;
    drag = true;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
  }
  function move(e) {
    if (!drag) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    delta = x - startX;

    slides[cur].style.transform = `translateX(${delta}px)`;
    const neigh = delta < 0 ? (cur + 1) % tot : (cur - 1 + tot) % tot;
    slides[neigh].classList.add('active');
    slides[neigh].style.transform = `translateX(${delta < 0 ? slider.clientWidth + delta : delta - slider.clientWidth}px)`;
  }
  function up() {
    if (!drag) return; drag = false;

    const width = slider.clientWidth;
    const dir = delta < 0 ? 1 : -1;
    const neigh = delta < 0 ? (cur + 1) % tot : (cur - 1 + tot) % tot;

    slides[cur].classList.add('anim');
    slides[neigh].classList.add('anim');

    lock = true;

    if (Math.abs(delta) > thr) {
      slides[cur].style.transform = `translateX(${-dir * width}px)`;
      slides[neigh].style.transform = 'translateX(0)';

      slides[cur].addEventListener('transitionend', () => {
        slides[cur].classList.remove('active', 'anim');
        slides[neigh].classList.remove('anim');
        dots[cur].classList.remove('active');
        dots[neigh].classList.add('active');
        cnt.textContent = `${neigh + 1}/${tot}`;
        cur = neigh;
        lock = false;
      }, { once: true });
    } else {
      slides[cur].style.transform = 'translateX(0)';
      slides[neigh].style.transform = `translateX(${dir * width}px)`;

      slides[cur].addEventListener('transitionend', () => {
        slides[neigh].classList.remove('active', 'anim');
        slides[cur].classList.remove('anim');
        lock = false;
      }, { once: true });
    }
    delta = 0;
  }

  slider.addEventListener('mousedown', down);
  slider.addEventListener('mousemove', move);
  slider.addEventListener('mouseup', up);
  slider.addEventListener('mouseleave', up);

  slider.addEventListener('touchstart', down, { passive: true });
  slider.addEventListener('touchmove', move, { passive: true });
  slider.addEventListener('touchend', up);
};
