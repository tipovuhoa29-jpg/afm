document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. Countdown Timer (Target: 10/06/2026 23:59:59 UTC+7)
       ========================================================================== */
    const targetDate = new Date('2026-06-10T23:59:59+07:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            document.getElementById('days').innerText = '00';
            document.getElementById('hours').innerText = '00';
            document.getElementById('minutes').innerText = '00';
            document.getElementById('seconds').innerText = '00';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = String(days).padStart(2, '0');
        document.getElementById('hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('minutes').innerText = String(minutes).padStart(2, '0');
        document.getElementById('seconds').innerText = String(seconds).padStart(2, '0');
    }

    // Run immediately and update every second
    updateCountdown();
    setInterval(updateCountdown, 1000);


    /* ==========================================================================
       2. FAQ Accordion
       ========================================================================== */
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // If item wasn't active, open it
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });


    /* ==========================================================================
       3. Sticky Bottom CTA Bar Control
       ========================================================================== */
    const stickyBar = document.getElementById('sticky-bar');
    const offerSection = document.getElementById('offer-section');
    const finalCtaSection = document.getElementById('final-cta');

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || window.pageYOffset;
        const screenHeight = window.innerHeight;

        // Show sticky bar after scrolling past 400px
        const passHero = scrollPosition > 400;

        // Hide sticky bar when offer section or final CTA section is in view
        let nearRegistration = false;
        if (offerSection) {
            const rect = offerSection.getBoundingClientRect();
            nearRegistration = rect.top < screenHeight - 100;
        }
        if (finalCtaSection && !nearRegistration) {
            const rect = finalCtaSection.getBoundingClientRect();
            nearRegistration = rect.top < screenHeight - 100;
        }

        if (passHero && !nearRegistration) {
            stickyBar.classList.add('visible');
        } else {
            stickyBar.classList.remove('visible');
        }
    });


    /* ==========================================================================
       4. Registration Modal & Payment Flow
       ========================================================================== */
    const modal = document.getElementById('registration-modal');
    const ctaButtons = document.querySelectorAll('a[href="#offer-section"], .sticky-cta-btn, #register-trigger-btn');
    const closeBtn = document.querySelector('.modal-close-btn');
    const regForm = document.getElementById('reg-form');
    
    // Steps containers
    const stepForm = document.getElementById('step-form-container');
    const stepPayment = document.getElementById('step-payment-container');
    const stepSuccess = document.getElementById('step-success-container');
    
    // Payment detail selectors
    const qrImg = document.getElementById('payment-qr-img');
    const paymentCodeText = document.getElementById('payment-code');
    const timerText = document.getElementById('payment-timer-countdown');
    const simulateSuccessBtn = document.getElementById('simulate-success-btn');

    let paymentTimer = null;
    let autoSuccessTimeout = null;

    // Helper to open modal at specific step
    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
        
        // Reset steps
        stepForm.classList.add('active');
        stepPayment.classList.remove('active');
        stepSuccess.classList.remove('active');
    }

    // Helper to close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable page scrolling
        
        // Clear active timers
        if (paymentTimer) clearInterval(paymentTimer);
        if (autoSuccessTimeout) clearTimeout(autoSuccessTimeout);
    }

    // Bind all CTA buttons to open registration form
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent anchor scroll if we are showing modal
            e.preventDefault();
            openModal();
        });
    });

    closeBtn.addEventListener('click', closeModal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form Submission: Form Entry -> QR Code
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Gather Form Data
        const name = document.getElementById('user-name').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const email = document.getElementById('user-email').value.trim();

        if (!name || !phone || !email) {
            alert('Vui lòng nhập đầy đủ thông tin bắt buộc.');
            return;
        }

        // 2. Generate Random Transaction Code (5 digit unique identifier)
        const randCode = Math.floor(10000 + Math.random() * 90000);
        const transactionCode = `AFM${randCode}`;
        paymentCodeText.innerText = transactionCode;

        // 3. Dynamically Generate VietQR Image URL
        // API: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
        const bankId = 'MB';
        const accountNo = '0319500991';
        const amount = '997000';
        const accountName = encodeURIComponent('CONG TY CO PHAN SUNEXT AI');
        const addInfo = encodeURIComponent(transactionCode);
        
        const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
        qrImg.src = vietQrUrl;

        // 4. Transition Step UI
        stepForm.classList.remove('active');
        stepPayment.classList.add('active');

        // 5. Start 10-Minute Countdown Timer for payment session
        startPaymentCountdown(10 * 60);

        // 6. Simulate Auto-Success check (Demo mode)
        // Automatically transitions to success after 10 seconds to show the user how the webhook works.
        autoSuccessTimeout = setTimeout(() => {
            transitionToSuccess();
        }, 10000);
    });

    // Countdown function for QR Payment Step
    function startPaymentCountdown(durationSeconds) {
        if (paymentTimer) clearInterval(paymentTimer);
        
        let remaining = durationSeconds;
        
        function tick() {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            
            timerText.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(paymentTimer);
                timerText.innerText = "Hết hạn";
                timerText.style.color = "#DC3545";
                alert("Mã thanh toán đã hết hạn, vui lòng đăng ký lại.");
                closeModal();
            }
            remaining--;
        }
        
        tick();
        paymentTimer = setInterval(tick, 1000);
    }

    // Simulate Success Action Trigger
    simulateSuccessBtn.addEventListener('click', () => {
        transitionToSuccess();
    });

    // Helper to transition payment -> success screen
    function transitionToSuccess() {
        if (paymentTimer) clearInterval(paymentTimer);
        if (autoSuccessTimeout) clearTimeout(autoSuccessTimeout);

        stepPayment.classList.remove('active');
        stepSuccess.classList.add('active');
    }
});
