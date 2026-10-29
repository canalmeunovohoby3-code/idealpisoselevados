(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('primary-nav');
  const navScrim = document.querySelector('[data-nav-close]');
  const main = document.querySelector('main');
  const footer = document.querySelector('.site-footer');
  const whatsappFloat = document.querySelector('.whatsapp-float');
  const skipLink = document.querySelector('.skip-link');
  const mobileNavQuery = window.matchMedia('(max-width: 960px)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = false;

  const setInert = (element, value) => {
    if (!element) return;
    if ('inert' in element) {
      element.inert = value;
    } else if (value) {
      element.setAttribute('inert', '');
    } else {
      element.removeAttribute('inert');
    }
  };

  /* ---------------------------------------------------------------
     Cabeçalho fixo + link ativo conforme a seção visível
     --------------------------------------------------------------- */

  const navLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));
  const navSections = navLinks
    .map((link) => {
      const target = link.getAttribute('href');
      return target && target.length > 1 ? document.querySelector(target) : null;
    })
    .filter(Boolean);

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const updateActiveLink = () => {
    if (!navSections.length) return;

    const marker = window.scrollY + 240;
    let activeId = navSections[0].id;

    navSections.forEach((section) => {
      if (section.offsetTop <= marker) activeId = section.id;
    });

    const scrollBottom = window.innerHeight + window.scrollY;
    if (scrollBottom >= document.documentElement.scrollHeight - 4) {
      activeId = navSections[navSections.length - 1].id;
    }

    setActiveLink(activeId);
  };

  let scrollTicking = false;

  const updateOnScroll = () => {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    }
    if (whatsappFloat) {
      whatsappFloat.classList.toggle('is-visible', window.scrollY > 260);
    }
    updateActiveLink();
    scrollTicking = false;
  };

  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateOnScroll();

  /* ---------------------------------------------------------------
     Menu mobile
     --------------------------------------------------------------- */

  let menuIsOpen = false;

  const togglePageInert = (value) => {
    setInert(main, value);
    setInert(footer, value);
    setInert(whatsappFloat, value);
    setInert(skipLink, value);
  };

  const openMenu = () => {
    if (!menuToggle || !nav || !mobileNavQuery.matches) return;
    menuIsOpen = true;
    body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
    togglePageInert(true);

    const firstLink = nav.querySelector('a');
    if (firstLink) {
      window.setTimeout(() => firstLink.focus({ preventScroll: true }), 120);
    }
  };

  const closeMenu = (restoreFocus = false) => {
    if (!menuIsOpen) return;
    menuIsOpen = false;
    body.classList.remove('menu-open');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu');
      if (restoreFocus) menuToggle.focus({ preventScroll: true });
    }
    togglePageInert(false);
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      if (menuIsOpen) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link && menuIsOpen) closeMenu(false);
    });

    if (navScrim) {
      navScrim.addEventListener('click', () => closeMenu(true));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuIsOpen) {
        closeMenu(true);
      }
    });

    const handleViewportChange = (event) => {
      if (!event.matches) closeMenu(false);
    };

    if (typeof mobileNavQuery.addEventListener === 'function') {
      mobileNavQuery.addEventListener('change', handleViewportChange);
    } else if (typeof mobileNavQuery.addListener === 'function') {
      mobileNavQuery.addListener(handleViewportChange);
    }
  }

  /* ---------------------------------------------------------------
     Revelação suave das seções + stagger automático
     --------------------------------------------------------------- */

  const normalizeDelay = (value) => {
    if (!value) return '0s';
    return /ms$|s$/.test(value) ? value : `${value}s`;
  };

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const step = parseFloat(group.getAttribute('data-stagger')) || 0.07;
    const variant = group.getAttribute('data-stagger-variant') || 'up';

    Array.from(group.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      if (!child.hasAttribute('data-reveal')) {
        child.setAttribute('data-reveal', variant);
      }
      child.style.setProperty('--reveal-delay', `${(index * step).toFixed(3)}s`);
    });
  });

  document.querySelectorAll('[data-reveal-delay]').forEach((element) => {
    if (element.style.getPropertyValue('--reveal-delay')) return;
    element.style.setProperty(
      '--reveal-delay',
      normalizeDelay(element.getAttribute('data-reveal-delay'))
    );
  });

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if (revealItems.length) {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  /* ---------------------------------------------------------------
     Títulos com revelação por palavras (máscara)
     --------------------------------------------------------------- */

  const splitTargets = Array.from(document.querySelectorAll('[data-split-words]'));

  const splitWords = (element) => {
    if (element.dataset.splitReady === 'true') return;

    const textNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode.nodeValue.trim()) textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    let wordIndex = 0;

    textNodes.forEach((node) => {
      const parts = node.nodeValue.split(/(\s+)/);
      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        const word = document.createElement('span');
        word.className = 'mask-word';

        const inner = document.createElement('span');
        inner.className = 'mask-word-inner';
        inner.textContent = part;
        inner.style.setProperty('--word-index', wordIndex);
        word.appendChild(inner);

        fragment.appendChild(word);
        wordIndex += 1;
      });

      node.parentNode.replaceChild(fragment, node);
    });

    element.dataset.splitReady = 'true';
    element.classList.add('split-ready');
  };

  if (splitTargets.length && !reducedMotion) {
    const noSplitObserver = !('IntersectionObserver' in window);
    let splitObserver = null;

    if (!noSplitObserver) {
      splitObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }
      );
    }

    splitTargets.forEach((target) => {
      splitWords(target);
      if (splitObserver) {
        splitObserver.observe(target);
      } else {
        target.classList.add('is-revealed');
      }
    });

    // Segurança: se algo impedir o observer, revela apenas o que está na tela.
    window.setTimeout(() => {
      splitTargets.forEach((target) => {
        if (target.classList.contains('is-revealed')) return;
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          target.classList.add('is-revealed');
        }
      });
    }, 2200);

  }


  /* ---------------------------------------------------------------
     Typewriter do título principal do hero
     --------------------------------------------------------------- */

  const setupTypewriter = () => {
    const title = document.querySelector('[data-typewriter]');
    if (!title) return;

    if (reducedMotion) {
      title.classList.add('type-ready');
      return;
    }

    const textNodes = [];
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode.nodeValue.trim()) textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    let characterIndex = 0;
    let lastLetterIndex = 0;

    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();

      Array.from(node.nodeValue).forEach((character) => {
        if (/\s/.test(character)) {
          fragment.appendChild(document.createTextNode(character));
          characterIndex += 2;
          return;
        }

        const letter = document.createElement('span');
        letter.className = 'type-letter';
        letter.textContent = character;
        letter.style.setProperty('--type-index', characterIndex);
        lastLetterIndex = characterIndex;
        fragment.appendChild(letter);
        characterIndex += 1;
      });

      node.parentNode.replaceChild(fragment, node);
    });

    // Duração real da digitação (delay inicial + último caractere + animação).
    const typingDuration = 250 + lastLetterIndex * 55 + 600;
    let restartTimer = null;
    let completeTimer = null;

    const runTypewriter = () => {
      window.clearTimeout(restartTimer);
      window.clearTimeout(completeTimer);

      title.classList.remove('type-ready', 'typing-complete');
      void title.offsetWidth;
      title.classList.add('type-ready');

      completeTimer = window.setTimeout(() => {
        title.classList.add('typing-complete');
      }, typingDuration + 30);

      // Um segundo de pausa com o título totalmente visível, depois recomeça.
      restartTimer = window.setTimeout(runTypewriter, typingDuration + 1000);
    };

    runTypewriter();
  };

  setupTypewriter();

  /* ---------------------------------------------------------------
     Galeria com visualização ampliada
     --------------------------------------------------------------- */

  const galleryItems = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lightbox = document.getElementById('gallery-lightbox');

  if (galleryItems.length && lightbox) {
    const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
    const lightboxCaption = lightbox.querySelector('[data-lightbox-caption]');
    const lightboxCount = lightbox.querySelector('[data-lightbox-count]');
    const closeButton = lightbox.querySelector('[data-lightbox-close]');
    const prevButton = lightbox.querySelector('[data-lightbox-prev]');
    const nextButton = lightbox.querySelector('[data-lightbox-next]');
    let currentIndex = 0;
    let lastTrigger = null;
    let supportsDialog = typeof lightbox.showModal === 'function';

    if (lightboxCaption) lightboxCaption.setAttribute('aria-live', 'polite');

    const renderSlide = (index) => {
      const total = galleryItems.length;
      currentIndex = (index + total) % total;

      const item = galleryItems[currentIndex];
      const itemImage = item.querySelector('img');
      if (!itemImage || !lightboxImage) return;

      lightboxImage.src = itemImage.currentSrc || itemImage.src;
      lightboxImage.alt = itemImage.alt;
      if (lightboxCaption) {
        lightboxCaption.textContent = item.dataset.caption || itemImage.alt;
      }
      if (lightboxCount) {
        lightboxCount.textContent = `${currentIndex + 1} / ${total}`;
      }
    };

    const preloadNeighbors = () => {
      [currentIndex - 1, currentIndex + 1].forEach((index) => {
        const item = galleryItems[(index + galleryItems.length) % galleryItems.length];
        const image = item ? item.querySelector('img') : null;
        if (image) {
          const preload = new Image();
          preload.src = image.currentSrc || image.src;
        }
      });
    };

    const animateLightboxImage = () => {
      if (reducedMotion || !lightboxImage || typeof lightboxImage.animate !== 'function') {
        return;
      }

      if (typeof lightboxImage.getAnimations === 'function') {
        lightboxImage.getAnimations().forEach((animation) => animation.cancel());
      }

      lightboxImage.animate(
        [
          { opacity: 0, transform: 'scale(0.965)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        {
          duration: 420,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }
      );
    };

    const openLightbox = (index, trigger) => {
      lastTrigger = trigger || null;
      renderSlide(index);
      preloadNeighbors();

      if (supportsDialog) {
        if (!lightbox.open) lightbox.showModal();
      } else {
        lightbox.setAttribute('open', '');
      }

      body.classList.add('lightbox-open');
      window.requestAnimationFrame(animateLightboxImage);
      if (closeButton) {
        window.setTimeout(() => closeButton.focus({ preventScroll: true }), 40);
      }
    };

    const restoreLightboxFocus = () => {
      if (!lastTrigger) return;
      lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    };

    const closeLightbox = () => {
      if (supportsDialog) {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
        body.classList.remove('lightbox-open');
        restoreLightboxFocus();
      }
    };

    const showPrevious = () => {
      renderSlide(currentIndex - 1);
      preloadNeighbors();
      animateLightboxImage();
    };

    const showNext = () => {
      renderSlide(currentIndex + 1);
      preloadNeighbors();
      animateLightboxImage();
    };

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index, item));
    });

    if (closeButton) closeButton.addEventListener('click', closeLightbox);
    if (prevButton) prevButton.addEventListener('click', showPrevious);
    if (nextButton) nextButton.addEventListener('click', showNext);

    lightbox.addEventListener('close', () => {
      body.classList.remove('lightbox-open');
      restoreLightboxFocus();
    });

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    });

    let touchStartX = null;

    lightbox.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length === 1) touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      'touchend',
      (event) => {
        if (touchStartX === null || !event.changedTouches.length) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(deltaX) < 48) return;
        if (deltaX > 0) {
          showPrevious();
        } else {
          showNext();
        }
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------
     Microinterações com ponteiro (desktop)
     --------------------------------------------------------------- */

  const setupPointerEffects = () => {
    if (reducedMotion || !finePointerQuery.matches || window.innerWidth <= 1024) return;

    const hero = document.querySelector('.hero');
    const heroMedia = document.querySelector('.hero-media');

    if (hero && heroMedia) {
      let heroRect = null;
      let heroFrame = null;
      let pointerX = 0;
      let pointerY = 0;

      const applyHeroParallax = () => {
        if (reducedMotion) {
          heroFrame = null;
          return;
        }

        if (!heroRect) heroRect = hero.getBoundingClientRect();

        const x = (pointerX - heroRect.left) / heroRect.width - 0.5;
        const y = (pointerY - heroRect.top) / heroRect.height - 0.5;

        heroMedia.style.setProperty('--parallax-x', `${(x * 12).toFixed(2)}px`);
        heroMedia.style.setProperty('--parallax-y', `${(y * 8).toFixed(2)}px`);
        heroFrame = null;
      };

      const resetHeroParallax = () => {
        heroMedia.style.setProperty('--parallax-x', '0px');
        heroMedia.style.setProperty('--parallax-y', '0px');
      };

      hero.addEventListener(
        'pointerenter',
        () => {
          heroRect = hero.getBoundingClientRect();
        },
        { passive: true }
      );

      hero.addEventListener(
        'pointermove',
        (event) => {
          if (reducedMotion || window.innerWidth <= 1024) return;
          pointerX = event.clientX;
          pointerY = event.clientY;
          if (!heroFrame) heroFrame = window.requestAnimationFrame(applyHeroParallax);
        },
        { passive: true }
      );

      hero.addEventListener('pointerleave', resetHeroParallax, { passive: true });
      window.addEventListener('scroll', () => { heroRect = null; }, { passive: true });
      window.addEventListener(
        'resize',
        () => {
          heroRect = null;
          resetHeroParallax();
        },
        { passive: true }
      );
    }

    document.querySelectorAll('[data-magnetic]').forEach((button) => {
      let frame = null;
      let targetX = 0;
      let targetY = 0;

      const applyMagnet = () => {
        button.style.setProperty('--magnet-x', `${targetX.toFixed(2)}px`);
        button.style.setProperty('--magnet-y', `${targetY.toFixed(2)}px`);
        frame = null;
      };

      const resetMagnet = () => {
        targetX = 0;
        targetY = 0;
        applyMagnet();
      };

      button.addEventListener(
        'pointermove',
        (event) => {
          if (reducedMotion || window.innerWidth <= 1024) return;
          const rect = button.getBoundingClientRect();
          targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
          targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
          if (!frame) frame = window.requestAnimationFrame(applyMagnet);
        },
        { passive: true }
      );

      button.addEventListener('pointerleave', resetMagnet, { passive: true });
      button.addEventListener('blur', resetMagnet);
    });

    document.querySelectorAll('.service-card').forEach((card) => {
      let frame = null;
      let spotX = 0;
      let spotY = 0;

      const applySpotlight = () => {
        card.style.setProperty('--spot-x', `${spotX.toFixed(1)}px`);
        card.style.setProperty('--spot-y', `${spotY.toFixed(1)}px`);
        frame = null;
      };

      card.addEventListener(
        'pointermove',
        (event) => {
          if (reducedMotion || window.innerWidth <= 1024) return;
          const rect = card.getBoundingClientRect();
          spotX = event.clientX - rect.left;
          spotY = event.clientY - rect.top;
          if (!frame) frame = window.requestAnimationFrame(applySpotlight);
        },
        { passive: true }
      );

      card.addEventListener(
        'pointerleave',
        () => {
          card.style.removeProperty('--spot-x');
          card.style.removeProperty('--spot-y');
        },
        { passive: true }
      );
    });
  };

  setupPointerEffects();

  /* ---------------------------------------------------------------
     Formulário de orçamento
     --------------------------------------------------------------- */

  const quoteForm = document.querySelector('[data-quote-form]');

  if (quoteForm) {
    const nameField = quoteForm.querySelector('#quote-name');
    const phoneField = quoteForm.querySelector('#quote-phone');
    const serviceField = quoteForm.querySelector('#quote-service');
    const formStatus = quoteForm.querySelector('[data-quote-status]');

    const formatPhone = (value) => {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (!digits) return '';
      if (digits.length <= 2) return `(${digits}`;

      const ddd = digits.slice(0, 2);
      const number = digits.slice(2);

      if (number.length <= 4) return `(${ddd}) ${number}`;
      if (digits.length <= 10) {
        return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
      }

      return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    };

    const setFieldError = (field, message) => {
      if (!field) return;
      const wrapper = field.closest('.form-field');
      const error = wrapper ? wrapper.querySelector('.form-error') : null;

      if (wrapper) wrapper.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = message;
    };

    const clearFieldError = (field) => {
      if (!field) return;
      const wrapper = field.closest('.form-field');
      const error = wrapper ? wrapper.querySelector('.form-error') : null;

      if (wrapper) wrapper.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    };

    const clearFormStatus = () => {
      if (!formStatus) return;
      formStatus.textContent = '';
      formStatus.dataset.state = '';
    };

    if (phoneField) {
      phoneField.addEventListener('input', () => {
        const caret = phoneField.selectionStart || 0;
        const digitsBeforeCaret = phoneField.value.slice(0, caret).replace(/\D/g, '').length;
        phoneField.value = formatPhone(phoneField.value);

        let position = 0;
        let seenDigits = 0;
        while (position < phoneField.value.length && seenDigits < digitsBeforeCaret) {
          if (/\d/.test(phoneField.value[position])) seenDigits += 1;
          position += 1;
        }

        phoneField.setSelectionRange(position, position);
        clearFieldError(phoneField);
        clearFormStatus();
      });
    }

    if (nameField) {
      nameField.addEventListener('input', () => {
        clearFieldError(nameField);
        clearFormStatus();
      });
    }

    if (serviceField) {
      serviceField.addEventListener('change', () => {
        clearFieldError(serviceField);
        clearFormStatus();
      });
    }

    quoteForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = nameField ? nameField.value.trim().replace(/\s+/g, ' ') : '';
      const phone = phoneField ? phoneField.value.trim() : '';
      const phoneDigits = phone.replace(/\D/g, '');
      const service = serviceField ? serviceField.value : '';
      let firstInvalidField = null;

      if (!name || name.length < 2) {
        setFieldError(nameField, 'Informe seu nome completo.');
        firstInvalidField = firstInvalidField || nameField;
      } else {
        clearFieldError(nameField);
      }

      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        setFieldError(phoneField, 'Informe um WhatsApp válido com DDD.');
        firstInvalidField = firstInvalidField || phoneField;
      } else {
        clearFieldError(phoneField);
      }

      if (!service) {
        setFieldError(serviceField, 'Selecione o tipo de serviço.');
        firstInvalidField = firstInvalidField || serviceField;
      } else {
        clearFieldError(serviceField);
      }

      if (firstInvalidField) {
        if (formStatus) {
          formStatus.textContent = 'Revise os campos destacados.';
          formStatus.dataset.state = 'error';
        }
        firstInvalidField.focus();
        return;
      }

      const message = `Olá! Meu nome é ${name}, meu WhatsApp é ${phone} e gostaria de solicitar um orçamento para o serviço de ${service}. Aguardo o contato!`;
      const whatsappUrl = `https://wa.me/5511979605845?text=${encodeURIComponent(message)}`;

      if (formStatus) {
        formStatus.textContent = 'Abrindo o WhatsApp com sua solicitação...';
        formStatus.dataset.state = 'success';
      }

      window.location.href = whatsappUrl;
    });
  }

  /* ---------------------------------------------------------------
     Seção de vídeos (sempre sem áudio)
     --------------------------------------------------------------- */

  const videoCards = Array.from(document.querySelectorAll('[data-video-card]'));

  if (videoCards.length) {
    const videos = videoCards
      .map((card) => card.querySelector('video'))
      .filter(Boolean);

    const pauseOtherVideos = (currentVideo) => {
      videos.forEach((video) => {
        if (video !== currentVideo && !video.paused) video.pause();
      });
    };

    videoCards.forEach((card) => {
      const video = card.querySelector('video');
      const button = card.querySelector('[data-video-toggle]');
      if (!video || !button) return;

      const title = card.dataset.videoTitle || 'instalação da Ideal Pisos';
      const number = card.dataset.videoNumber || '01';

      const enforceMuted = () => {
        if (!video.muted || video.volume !== 0) {
          video.muted = true;
          video.volume = 0;
        }
      };

      const updateCardState = () => {
        const isPlaying = !video.paused;
        card.classList.toggle('is-playing', isPlaying);
        button.setAttribute('aria-pressed', String(isPlaying));
        button.setAttribute(
          'aria-label',
          `${isPlaying ? 'Pausar' : 'Reproduzir'} vídeo ${number}: ${title}`
        );
      };

      enforceMuted();
      video.addEventListener('volumechange', enforceMuted);
      video.addEventListener('play', () => {
        pauseOtherVideos(video);
        updateCardState();
      });
      video.addEventListener('playing', () => {
        card.classList.remove('is-loading');
      });
      video.addEventListener('pause', () => {
        card.classList.remove('is-loading');
        updateCardState();
      });
      video.addEventListener('error', () => {
        card.classList.remove('is-loading');
      });

      button.addEventListener('click', () => {
        enforceMuted();

        if (video.paused) {
          pauseOtherVideos(video);
          card.classList.add('is-loading');
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              card.classList.remove('is-loading');
              updateCardState();
            });
          }
        } else {
          card.classList.remove('is-loading');
          video.pause();
        }
      });

      updateCardState();
    });
  }

  /* ---------------------------------------------------------------
     Ano atualizado automaticamente
     --------------------------------------------------------------- */

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  document.documentElement.classList.add('reveal-ready');
})();

