(function() {
    "use strict";

    // ---------- DOM refs ----------
    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');
    const themeToggle = document.getElementById('themeToggle');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    // ---------- state ----------
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;
    let expression = '';

    // ---------- theme management ----------
    let currentTheme = localStorage.getItem('calc_theme') || 'dark';

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        currentTheme = theme;
        localStorage.setItem('calc_theme', theme);
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    themeToggle.addEventListener('click', () => {
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    setTheme(currentTheme);

    // ---------- custom cursor ----------
    let mouseX = 0,
        mouseY = 0;
    let ringX = 0,
        ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // interactive elements for cursor
    const interactiveElements = document.querySelectorAll('.btn, .theme-toggle, .calc-header');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('active');
            ring.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('active');
            ring.classList.remove('active');
        });
    });

    if ('ontouchstart' in window) {
        dot.style.display = 'none';
        ring.style.display = 'none';
        document.body.style.cursor = 'auto';
    }

    // ---------- calculator logic ----------
    function updateDisplay() {
        // format number with commas for display
        let displayValue = currentInput;
        if (displayValue.length > 12) {
            displayValue = parseFloat(displayValue).toExponential(6);
        }
        resultDisplay.textContent = displayValue;
        expressionDisplay.textContent = expression;

        // scroll display if too long
        if (displayValue.length > 10) {
            resultDisplay.style.fontSize = '2rem';
        } else {
            resultDisplay.style.fontSize = '3rem';
        }
    }

    function inputDigit(digit) {
        if (shouldResetDisplay) {
            currentInput = digit;
            shouldResetDisplay = false;
        } else {
            if (currentInput === '0' && digit !== '.') {
                currentInput = digit;
            } else {
                if (currentInput.length >= 15) return;
                currentInput += digit;
            }
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (shouldResetDisplay) {
            currentInput = '0.';
            shouldResetDisplay = false;
            updateDisplay();
            return;
        }
        if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }

    function handleOperator(op) {
        if (operator !== null && !shouldResetDisplay) {
            calculate();
        }
        previousInput = currentInput;
        operator = op;
        expression = currentInput + ' ' + getSymbol(op) + ' ';
        shouldResetDisplay = true;
        updateDisplay();
    }

    function getSymbol(op) {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '%': '%',
            '^': '²',
            '√': '√'
        };
        return symbols[op] || op;
    }

    function calculate() {
        if (operator === null || shouldResetDisplay) return;

        const prev = parseFloat(previousInput);
        const curr = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(curr)) return;

        let result;
        switch (operator) {
            case '+':
                result = prev + curr;
                break;
            case '-':
                result = prev - curr;
                break;
            case '*':
                result = prev * curr;
                break;
            case '/':
                if (curr === 0) {
                    resultDisplay.textContent = 'Error';
                    expressionDisplay.textContent = 'Cannot divide by zero';
                    resetCalculator();
                    return;
                }
                result = prev / curr;
                break;
            case '%':
                result = (prev * curr) / 100;
                break;
            case '^':
                result = Math.pow(prev, curr);
                break;
            case '√':
                if (prev < 0) {
                    resultDisplay.textContent = 'Error';
                    expressionDisplay.textContent = 'Invalid input';
                    resetCalculator();
                    return;
                }
                result = Math.sqrt(prev);
                break;
            default:
                return;
        }

        // handle floating point precision
        result = parseFloat(result.toPrecision(12));

        expression = previousInput + ' ' + getSymbol(operator) + ' ' + currentInput + ' =';
        currentInput = String(result);
        operator = null;
        previousInput = '';
        shouldResetDisplay = true;
        updateDisplay();

        // add subtle animation
        resultDisplay.style.transform = 'scale(1.02)';
        setTimeout(() => {
            resultDisplay.style.transform = 'scale(1)';
        }, 150);
    }

    function resetCalculator() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        expression = '';
        updateDisplay();
    }

    function clearEntry() {
        if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
            if (currentInput === '' || currentInput === '-') {
                currentInput = '0';
            }
        } else {
            currentInput = '0';
        }
        updateDisplay();
    }

    function handleClear() {
        if (currentInput !== '0' || expression !== '') {
            currentInput = '0';
            expression = '';
            previousInput = '';
            operator = null;
            shouldResetDisplay = false;
            updateDisplay();
        } else {
            resetCalculator();
        }
    }

    // ---------- button event handling ----------
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const action = this.dataset.action;
            const value = this.dataset.value;

            // ripple effect
            createRipple(e, this);

            // magnetic effect on click
            this.style.transform = 'scale(0.92)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);

            switch (action) {
                case 'number':
                    inputDigit(value);
                    break;
                case 'decimal':
                    inputDecimal();
                    break;
                case 'operator':
                    if (value === '√') {
                        // handle square root as unary operator
                        if (currentInput === '0') return;
                        const num = parseFloat(currentInput);
                        if (num < 0) {
                            resultDisplay.textContent = 'Error';
                            expressionDisplay.textContent = 'Invalid input';
                            resetCalculator();
                            return;
                        }
                        const result = Math.sqrt(num);
                        expression = '√(' + currentInput + ') =';
                        currentInput = String(parseFloat(result.toPrecision(12)));
                        shouldResetDisplay = true;
                        updateDisplay();
                        return;
                    }
                    handleOperator(value);
                    break;
                case 'equals':
                    calculate();
                    break;
                case 'clear':
                    handleClear();
                    break;
                default:
                    break;
            }
        });

        // keyboard support
        btn.addEventListener('keydown', (e) => {
            e.preventDefault();
        });
    });

    // ---------- ripple effect ----------
    function createRipple(e, btn) {
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    // ---------- keyboard support ----------
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            e.preventDefault();
            inputDigit(key);
            highlightButton(`[data-value="${key}"]`);
            return;
        }

        switch (key) {
            case '.':
                e.preventDefault();
                inputDecimal();
                highlightButton('[data-action="decimal"]');
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                e.preventDefault();
                let op = key;
                if (key === '*') op = '*';
                if (key === '/') op = '/';
                handleOperator(op);
                highlightButton(`[data-value="${op}"]`);
                break;
            case 'Enter':
            case '=':
                e.preventDefault();
                calculate();
                highlightButton('[data-action="equals"]');
                break;
            case 'Backspace':
                e.preventDefault();
                clearEntry();
                break;
            case 'Escape':
            case 'c':
            case 'C':
                e.preventDefault();
                resetCalculator();
                highlightButton('[data-action="clear"]');
                break;
            case '%':
                e.preventDefault();
                handleOperator('%');
                highlightButton(`[data-value="%"]`);
                break;
            case '^':
                e.preventDefault();
                handleOperator('^');
                highlightButton(`[data-value="^"]`);
                break;
            default:
                break;
        }
    });

    function highlightButton(selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.style.transform = 'scale(0.92)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }
    }

    // ---------- magnetic button effect (enhanced) ----------
    document.querySelectorAll('.btn, .theme-toggle').forEach(el => {
        el.addEventListener('mousemove', function(e) {
            if (window.innerWidth < 768) return;
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const strength = 10;
            const rotStrength = 1.5;
            const transX = x / strength;
            const transY = y / strength;
            const rotX = -y / (rect.height / 2) * rotStrength;
            const rotY = x / (rect.width / 2) * rotStrength;

            if (!this.classList.contains('btn-equals')) {
                this.style.transform =
                    `translate(${transX}px, ${transY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
            } else {
                this.style.transform =
                    `translate(${transX * 0.5}px, ${transY * 0.5}px) scale(1.02)`;
            }
        });

        el.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
            setTimeout(() => {
                this.style.transition = '';
            }, 300);
        });
    });

    // ---------- init ----------
    resetCalculator();

    // resize handler for display
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateDisplay();
        }, 100);
    });

    console.log('✦ VECTOR · calculator with light/dark theme & magnetic interactions');
})();