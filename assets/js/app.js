// app.js — lógica principal (inicia al cargar DOM)
document.addEventListener('DOMContentLoaded', function(){
    // Helpers (BigInt)
    function factorialBig(n){
        n = Number(n);
        if (!Number.isInteger(n) || n < 0) return null;
        let res = 1n;
        for(let i=2;i<=n;i++) res *= BigInt(i);
        return res;
    }

    function bigintToString(x){
        if (typeof x !== 'bigint') return String(x);
    // formatea miles
        const s = x.toString();
        let out = '';
        let cnt=0;
        for(let i=s.length-1;i>=0;i--){
            out = s[i] + out; cnt++;
            if (cnt===3 && i!==0){ out = ',' + out; cnt=0; }
        }
        return out;
    }

    function nPr(n,r){
        if (r>n) return 0n;
        let num = 1n;
        for(let i=0;i<r;i++) num *= BigInt(n-i);
        return num;
    }

    function nCr(n,r){
        if (r>n) return 0n;
        r = Math.min(r, n-r);
        if (r === 0) return 1n;
        let num = 1n;
        let den = 1n;
        for(let i=1;i<=r;i++){
            num *= BigInt(n - (r - i));
            den *= BigInt(i);
        }
        return num / den;
    }

    function setHtmlLatex(container, latex){
        if (!container) return;
        container.innerHTML = latex;
        if (window.MathJax && window.MathJax.typesetPromise){
            window.MathJax.typesetPromise([container]).catch(function(err){ console.error(err); });
        }
    }

    // Select DOM elements
    const permN = document.getElementById('perm-n');
    const permCalc = document.getElementById('perm-calc');
    const permResult = document.getElementById('perm-result');

    const prN = document.getElementById('pr-n');
    const prR = document.getElementById('pr-r');
    const prCalc = document.getElementById('pr-calc');
    const prResult = document.getElementById('pr-result');

    const crN = document.getElementById('cr-n');
    const crR = document.getElementById('cr-r');
    const crCalc = document.getElementById('cr-calc');
    const crPlot = document.getElementById('cr-plot');
    const crResult = document.getElementById('cr-result');

    const interp = document.getElementById('conteo-interpretacion');
    const canvas = document.getElementById('conteoChart');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let conteoChart = null;

    function showInterpretation(text){ if (interp) interp.textContent = text; }

    // Permutaciones
    if (permCalc && permN && permResult){
        permCalc.addEventListener('click', function(){
            const n = Number(permN.value);
            if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)){
                permResult.innerHTML = '<div class="text-danger">Ingrese un entero n ≥ 0.</div>';
                return;
            }
            const f = factorialBig(n);
            const theory = 'Permutaciones: número de arreglos distintos de los objetos cuando el orden importa.';
            const formula = `\\(P(n)=n!\\)`;
            let steps = '';
            if (n <= 10){
                const factors = Array.from({length:n},(_,i)=>i+1).join('\\cdot');
                steps = `\\(${n}! = ${factors} = ${bigintToString(f)}\\)`;
            } else {
                steps = `\\(${n}! = ${bigintToString(f)}\\)`;
            }
            const numeric = `\\(P=${bigintToString(f)}\\)`;
            const interpText = `Permutaciones de ${n} objetos: hay ${bigintToString(f)} arreglos distintos.`;
            renderDetailedAnswer(permResult, permExplain, theory, formula, steps, numeric, interpText);
        });
    }

    // Permutaciones con r
    if (prCalc && prN && prR && prResult){
        prCalc.addEventListener('click', function(){
            const n = Number(prN.value);
            const r = Number(prR.value);
            if (!Number.isInteger(n) || !Number.isInteger(r) || n<0 || r<0){
                prResult.innerHTML = '<div class="text-danger">Ingrese enteros n, r ≥ 0.</div>';
                return;
            }
            if (r>n){ prResult.innerHTML='<div class="text-warning">Si r &gt; n entonces nPr = 0.</div>'; return; }
            const val = nPr(n,r);
            const theory = 'Permutaciones con r: arreglos de r elementos tomados de n cuando el orden importa.';
            const formula = `\\(P(n,r)=\\dfrac{n!}{(n-r)!}\\)`;
            const steps = `\\(\\dfrac{${n}!}{(${n}-${r})!} = \\dfrac{${bigintToString(factorialBig(n))}}{${bigintToString(factorialBig(n-r))}} = ${bigintToString(val)}\\)`;
            const numeric = `\\(P(${n},${r}) = ${bigintToString(val)}\\)`;
            const interpText = `Número de arreglos de ${r} elementos tomados de ${n}: ${bigintToString(val)}.`;
            renderDetailedAnswer(prResult, prExplain, theory, formula, steps, numeric, interpText);
        });
    }

    // Combinaciones
    if (crCalc && crN && crR && crResult){
        crCalc.addEventListener('click', function(){
            const n = Number(crN.value);
            const r = Number(crR.value);
            if (!Number.isInteger(n) || !Number.isInteger(r) || n<0 || r<0){
                crResult.innerHTML = '<div class="text-danger">Ingrese enteros n, r ≥ 0.</div>';
                return;
            }
            if (r>n){ crResult.innerHTML='<div class="text-warning">Si r &gt; n entonces nCr = 0.</div>'; return; }
            const val = nCr(n,r);
            const theory = 'Combinaciones: número de maneras de seleccionar r elementos de n sin importar el orden.';
            const formula = `\\({n \\choose r} = \\dfrac{n!}{r!(n-r)!}\\)`;
            const steps = `\\(\\dfrac{${n}!}{${r}!(${n}-${r})!} = ${bigintToString(val)}\\)`;
            const numeric = `\\( {${n} \\choose ${r}} = ${bigintToString(val)}\\)`;
            const interpText = `Formas de elegir ${r} elementos de ${n} sin orden: ${bigintToString(val)}.`;
            renderDetailedAnswer(crResult, crExplain, theory, formula, steps, numeric, interpText);
        });
    }

    // Graficar C(n,k)
    if (crPlot && crN && crResult && ctx){
        crPlot.addEventListener('click', function(){
            const n = Number(crN.value);
            if (!Number.isInteger(n) || n<0){
                crResult.innerHTML = '<div class="text-danger">Ingrese entero n ≥ 0 para graficar.</div>'; return;
            }
            if (n > 80){
                crResult.innerHTML = '<div class="text-warning">n muy grande para graficar (ponga n ≤ 80).</div>'; return;
            }
            // Calcula C(n,k) para k=0..n
            const labels = [];
            const data = [];
            for(let k=0;k<=n;k++){
                labels.push(String(k));
                const v = nCr(n,k);
                // convertir a number si posible, sino aproximar
                const asNum = (v <= Number.MAX_SAFE_INTEGER) ? Number(v) : Number(v.toString().slice(0,15));
                data.push(asNum);
            }
            if (conteoChart) conteoChart.destroy();
            conteoChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: `C(${n},k)`, data, backgroundColor: 'rgba(13,110,253,0.7)'}] },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
            crResult.innerHTML = `<div class='text-success'>Gráfica generada para \\(0\le k\le ${n}\\).</div>`;
            setHtmlLatex(crResult, crResult.innerHTML);
            const theory = 'Distribución de combinaciones C(n,k) para k = 0..n.';
            const formula = `\\({n \\choose k} = \\dfrac{n!}{k!(n-k)!}\\)`;
            const steps = 'Se calculó C(n,k) para cada k; valores muy grandes se aproximaron para la visualización.';
            const interpText = `Se graficó C(n,k) para k desde 0 hasta ${n}. Valores grandes se muestran aproximados.`;
            if (crExplain) renderDetailedAnswer(null, crExplain, theory, formula, steps, null, interpText);
        });
    }
    
    // Sidebar hamburger toggle
    const sidebar = document.querySelector('.sidebar');
    const hamburgerBtns = Array.from(document.querySelectorAll('.hamburger-btn'));
    function setSidebarOpen(open){
        if (!sidebar) return;
        if (open){
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
        } else {
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
        }
        hamburgerBtns.forEach(btn => btn.setAttribute('aria-expanded', String(open)));
    }
    if (hamburgerBtns.length && sidebar){
        hamburgerBtns.forEach(btn => {
            btn.addEventListener('click', function(e){
                e.stopPropagation();
                const isOpen = sidebar.classList.contains('open');
                setSidebarOpen(!isOpen);
            });
        });
    // Close sidebar on nav click
        const sideLinks = Array.from(document.querySelectorAll('.side-link'));
        sideLinks.forEach(link => {
            link.addEventListener('click', function(){
                if (window.innerWidth <= 900){ setSidebarOpen(false); }
            });
        });
    // Close on outside click
        document.addEventListener('click', function(e){
            if (!sidebar.classList.contains('open')) return;
            if (!sidebar.contains(e.target) && !e.target.classList.contains('hamburger-btn')){
                setSidebarOpen(false);
            }
        });
    // Reset open state on resize
    window.addEventListener('resize', function(){ if (window.innerWidth > 900) setSidebarOpen(false); });
    }

    // Explanation containers (per page)
    const pbExplain = document.getElementById('pb-explain');
    const compExplain = document.getElementById('comp-explain');
    const sumExplain = document.getElementById('sum-explain');
    const prodExplain = document.getElementById('prod-explain');
    const permExplain = document.getElementById('perm-explain');
    const prExplain = document.getElementById('pr-explain');
    const crExplain = document.getElementById('cr-explain');
    const binExplain = document.getElementById('bin-explain');
    const poiExplain = document.getElementById('poi-explain');
    const nbExplain = document.getElementById('nb-explain');
 
    function renderDetailedAnswer(resultEl, explainEl, theory, formulaLatex, stepsLatex, numericLatex, interpretation){
    // renderDetailedAnswer args: resultEl, explainEl, theory, formula, steps, numeric, interpretation
        try{
            if (resultEl && numericLatex){ resultEl.innerHTML = `<div class="fw-bold">${numericLatex}</div>`; setHtmlLatexSafe(resultEl, resultEl.innerHTML); }
            if (!explainEl) return;
            let html = '';
            if (theory) html += `<div class="mb-2"><strong>Breve nota:</strong> ${theory}</div>`;
            if (formulaLatex) html += `<div class="mb-2"><strong>Fórmula:</strong> ${formulaLatex}</div>`;
            if (stepsLatex) html += `<div class="mb-2"><strong>Pasos:</strong> ${stepsLatex}</div>`;
            if (interpretation) html += `<div class="mt-2"><strong>Interpretación:</strong> ${interpretation}</div>`;
            explainEl.innerHTML = html;
            setHtmlLatexSafe(explainEl, explainEl.innerHTML);
        }catch(e){ console.error('renderDetailedAnswer', e); }
    }

    // Utility: approx. equality
    function approxEqual(a,b,tol=1e-6){
        if (!isFinite(a) || !isFinite(b)) return false;
        return Math.abs(a-b) <= tol;
    }

    // Discrete distributions: Binomial & Poisson
        const binN = document.getElementById('bin-n');
        const binP = document.getElementById('bin-p');
        const binK = document.getElementById('bin-k');
        const binType = document.getElementById('bin-type');
        const binCalc = document.getElementById('bin-calc');
        const binPlotBtn = document.getElementById('bin-plot');
        const binResult = document.getElementById('bin-result');
        const binCanvas = document.getElementById('binChart');
        const binCtx = binCanvas ? binCanvas.getContext('2d') : null;
        let binChart = null;

        const poiLambda = document.getElementById('poi-lambda');
        const poiK = document.getElementById('poi-k');
        const poiCalc = document.getElementById('poi-calc');
        const poiPlotBtn = document.getElementById('poi-plot');
        const poiResult = document.getElementById('poi-result');
        const poiCanvas = document.getElementById('poiChart');
        const poiCtx = poiCanvas ? poiCanvas.getContext('2d') : null;
        let poiChart = null;

    // Binomial negativa
        const nbR = document.getElementById('nb-r');
        const nbP = document.getElementById('nb-p');
        const nbK = document.getElementById('nb-k');
        const nbType = document.getElementById('nb-type');
        const nbCalc = document.getElementById('nb-calc');
        const nbPlotBtn = document.getElementById('nb-plot');
        const nbResult = document.getElementById('nb-result');
        const nbCanvas = document.getElementById('nbChart');
        const nbCtx = nbCanvas ? nbCanvas.getContext('2d') : null;
        let nbChart = null;

        function nCrNumber(n,r){
            // nCr multiplicativo (Number)
            n = Number(n); r = Number(r);
            if (r<0 || r>n) return 0;
            r = Math.min(r, n-r);
            let res = 1;
            for(let i=1;i<=r;i++){
                res *= (n - (r - i));
                res /= i;
            }
            return res;
        }

        function binomialPMF(n,k,p){
            if (p < 0 || p > 1) return 0;
            const c = nCrNumber(n,k);
            return c * Math.pow(p, k) * Math.pow(1-p, n-k);
        }

        function poissonPMF(lambda,k){
            if (lambda < 0) return 0;
            // factorial (Number)
            let fact = 1;
            for(let i=2;i<=k;i++) fact *= i;
            return Math.exp(-lambda) * Math.pow(lambda, k) / fact;
        }

        // Negative binomial PMF: P(K = k) = C(k + r -1, k) * (1-p)^k * p^r
        function negBinomialPMF(r,k,p){
            r = Number(r); k = Number(k); p = Number(p);
            if (r <= 0 || k < 0 || p < 0 || p > 1) return 0;
            const c = nCrNumber(k + r - 1, k);
            return c * Math.pow(1-p, k) * Math.pow(p, r);
        }

        // Negative Binomial calculate
        if (nbCalc && nbR && nbP && nbK && nbType && nbResult){
            nbCalc.addEventListener('click', function(){
                const r = Number(nbR.value);
                const p = Number(nbP.value);
                const k = Number(nbK.value);
                const type = nbType.value;
                if (!Number.isInteger(r) || r<=0 || !Number.isInteger(k) || k<0 || isNaN(p) || p<0 || p>1){
                    nbResult.innerHTML = '<div class="text-danger">Verifique r ≥ 1 entero, k ≥ 0 entero y 0 ≤ p ≤ 1.</div>'; return;
                }
                let prob = 0;
                if (type === 'exact') prob = negBinomialPMF(r,k,p);
                else if (type === 'atmost'){
                    for(let i=0;i<=k;i++) prob += negBinomialPMF(r,i,p);
                } else if (type === 'atleast'){
                    // P(≥k) = 1 - P(≤ k-1)
                    let s=0; for(let i=0;i<k;i++) s+= negBinomialPMF(r,i,p); prob = 1 - s;
                }
                const theory = 'Binomial negativa: modelo para contar el número de fallos antes de obtener r éxitos.';
                const formula = `\\(P(K=k)=\\binom{k+r-1}{k}(1-p)^k p^r\\)`;
                const comb = nCrNumber(k + r - 1, k);
                const steps = `\\(\\binom{${k}+${r}-1}{${k}} = ${comb};\\quad (1-p)^{k} = ${Math.pow(1-p,k).toFixed(6)};\\quad p^{r} = ${Math.pow(p,r).toFixed(6)}\\)`;
                const numeric = `\\(P = ${prob.toFixed(6)}\\)`;
                const interpText = `Probabilidad calculada: P = ${prob.toFixed(6)} (según el tipo seleccionado).`;
                renderDetailedAnswer(nbResult, nbExplain, theory, formula, steps, numeric, interpText);
            });
        }

        // Negative Binomial example quick-fill
        const nbFill = document.getElementById('nb-fill');
        if (nbFill && nbR && nbP && nbK && nbType){
            nbFill.addEventListener('click', function(){
                nbR.value = 3; nbP.value = 0.4; nbK.value = 2; nbType.value = 'exact';
                nbCalc.click();
            });
        }

        // Negative Binomial plot
        if (nbPlotBtn && nbR && nbP && nbCtx){
            nbPlotBtn.addEventListener('click', function(){
                const r = Number(nbR.value);
                const p = Number(nbP.value);
                if (!Number.isInteger(r) || r<=0 || isNaN(p) || p<0 || p>1){ nbResult.innerHTML = '<div class="text-danger">Ingrese r ≥ 1 entero y 0 ≤ p ≤ 1.</div>'; return; }
                // choose a reasonable k range around the mean: mean failures = r*(1-p)/p
                const meanFailures = r * (1-p) / (p || 1e-9);
                const sd = Math.sqrt(r * (1-p) / (p*p || 1e-9));
                const kMax = Math.min(200, Math.max(20, Math.ceil(meanFailures + 5*sd)));
                const labels = [];
                const data = [];
                for(let k=0;k<=kMax;k++){ labels.push(String(k)); data.push(Number((negBinomialPMF(r,k,p)).toFixed(8))); }
                if (nbChart) nbChart.destroy();
                nbChart = new Chart(nbCtx, { type:'bar', data:{ labels, datasets:[{ label:`NegBin(r=${r},p=${p})`, data, backgroundColor:'rgba(255,82,82,0.78)'}] }, options:{ plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } } });
                nbResult.innerHTML = `<div class='text-success'>Gráfica PMF para \(NegBin(r=${r},p=${p})\) (k = fallos antes del r-ésimo éxito)</div>`; setHtmlLatexSafe(nbResult, nbResult.innerHTML);
            });
        }

        function setHtmlLatexSafe(container, html){ if (!container) return; container.innerHTML = html; if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([container]).catch(()=>{}); }

        // Binomial calculate
        if (binCalc && binN && binP && binK && binType && binResult){
            binCalc.addEventListener('click', function(){
                const n = Number(binN.value);
                const p = Number(binP.value);
                const k = Number(binK.value);
                const type = binType.value;
                if (!Number.isInteger(n) || n<0 || isNaN(p) || p<0 || p>1 || !Number.isInteger(k) || k<0){
                    binResult.innerHTML = '<div class="text-danger">Verifique n ≥ 0 entero, 0 ≤ p ≤ 1 y k ≥ 0 entero.</div>'; return;
                }
                if (k > n) { binResult.innerHTML = '<div class="text-warning">k no puede ser mayor que n.</div>'; return; }
                let prob = 0;
                if (type === 'exact') prob = binomialPMF(n,k,p);
                else if (type === 'atmost'){
                    for(let i=0;i<=k;i++) prob += binomialPMF(n,i,p);
                } else if (type === 'atleast'){
                    for(let i=k;i<=n;i++) prob += binomialPMF(n,i,p);
                }
                const theory = 'Binomial: número de éxitos en n ensayos con probabilidad p por ensayo.';
                const formula = `\\(P(X=k)=\\binom{n}{k} p^{k} (1-p)^{n-k}\\)`;
                const comb = nCrNumber(n,k);
                const steps = `\\(\\binom{${n}}{${k}} = ${comb};\\quad p^{k} = ${Math.pow(p,k).toFixed(6)};\\quad (1-p)^{${n}-${k}} = ${Math.pow(1-p,n-k).toFixed(6)}\\)`;
                const numeric = `\\(P = ${prob.toFixed(6)}\\)`;
                const interpText = `Probabilidad calculada: P = ${prob.toFixed(6)} (${type === 'exact' ? 'exactamente' : type === 'atmost' ? 'a lo sumo' : 'al menos'}).`;
                renderDetailedAnswer(binResult, binExplain, theory, formula, steps, numeric, interpText);
            });
        }

        // Binomial example quick-fill
        const binFill = document.getElementById('bin-fill');
        if (binFill && binN && binP && binK && binType){
            binFill.addEventListener('click', function(){
                // ejemplo clásico: n=10, p=0.3, k=3
                binN.value = 10; binP.value = 0.3; binK.value = 3; binType.value = 'exact';
                binCalc.click();
            });
        }

        // Binomial plot
        if (binPlotBtn && binN && binP && binCtx){
            binPlotBtn.addEventListener('click', function(){
                const n = Number(binN.value);
                const p = Number(binP.value);
                if (!Number.isInteger(n) || n<0 || isNaN(p) || p<0 || p>1){ binResult.innerHTML = '<div class="text-danger">Ingrese n entero ≥ 0 y 0 ≤ p ≤ 1.</div>'; return; }
                if (n > 200){ binResult.innerHTML = '<div class="text-warning">n muy grande para graficar (n ≤ 200).</div>'; return; }
                const labels = [];
                const data = [];
                for(let k=0;k<=n;k++){ labels.push(String(k)); data.push(Number((binomialPMF(n,k,p)).toFixed(8))); }
                if (binChart) binChart.destroy();
                binChart = new Chart(binCtx, { type: 'bar', data:{ labels, datasets:[{ label: `Binomial(n=${n},p=${p})`, data, backgroundColor:'rgba(13,110,253,0.75)'}] }, options:{ plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } } });
                binResult.innerHTML = `<div class='text-success'>Gráfica PMF para \(Bin(n=${n},p=${p})\)</div>`; setHtmlLatexSafe(binResult, binResult.innerHTML);
            });
        }

        // Poisson calculate (supports exact / less / more)
        const poiType = document.getElementById('poi-type');
        if (poiCalc && poiLambda && poiK && poiResult && poiType){
            poiCalc.addEventListener('click', function(){
                const lambda = Number(poiLambda.value);
                const k = Number(poiK.value);
                const type = poiType.value; // 'exact', 'less', 'more'
                if (isNaN(lambda) || lambda<0 || !Number.isInteger(k) || k<0){ poiResult.innerHTML = '<div class="text-danger">Ingrese λ ≥ 0 y k ≥ 0 entero.</div>'; return; }
                let prob = 0;
                if (type === 'exact'){
                    prob = poissonPMF(lambda, k);
                } else if (type === 'less'){
                    for(let i=0;i<k;i++) prob += poissonPMF(lambda, i);
                } else if (type === 'more'){
                    // P(X > k) = 1 - P(X ≤ k)
                    let s = 0; for(let i=0;i<=k;i++) s += poissonPMF(lambda, i); prob = 1 - s;
                }
                const theory = 'Poisson: modelo de conteos para eventos raros por unidad de tiempo/espacio.';
                const formula = `\\(P(X=k)=e^{-\\lambda}\\dfrac{\\lambda^{k}}{k!}\\)`;
                // factorial for steps (only show for exact)
                let steps = '';
                if (type === 'exact'){
                    let fact = 1; for(let i=2;i<=k;i++) fact *= i;
                    steps = `\\(k! = ${fact};\\quad e^{-\\lambda} = ${Math.exp(-lambda).toFixed(6)};\\quad \\\\lambda^{k} = ${Math.pow(lambda,k).toFixed(6)}\\)`;
                } else if (type === 'less'){
                    steps = `\\(P(X < ${k}) = \\sum_{i=0}^{${k - 1}} e^{-\\lambda}\\dfrac{\\lambda^{i}}{i!}\\)`;
                } else {
                    steps = `\\(P(X > ${k}) = 1 - \\sum_{i=0}^{${k}} e^{-\\lambda}\\dfrac{\\lambda^{i}}{i!}\\)`;
                }
                const numeric = `\\(P = ${prob.toFixed(6)}\\)`;
                const interpText = (type === 'exact') ? `Probabilidad de observar exactamente ${k} eventos: P = ${prob.toFixed(6)}.` : (type === 'less' ? `Probabilidad de observar menos de ${k} eventos: P = ${prob.toFixed(6)}.` : `Probabilidad de observar más de ${k} eventos: P = ${prob.toFixed(6)}.`);
                renderDetailedAnswer(poiResult, poiExplain, theory, formula, steps, numeric, interpText);
            });
        }

        // Poisson example quick-fill
        const poiFill = document.getElementById('poi-fill');
        if (poiFill && poiLambda && poiK && poiType){
            poiFill.addEventListener('click', function(){
                poiLambda.value = 1.5; poiK.value = 2; poiType.value = 'exact';
                poiCalc.click();
            });
        }

        // Poisson plot
        if (poiPlotBtn && poiLambda && poiCtx){
            poiPlotBtn.addEventListener('click', function(){
                const lambda = Number(poiLambda.value);
                if (isNaN(lambda) || lambda<0){ poiResult.innerHTML = '<div class="text-danger">Ingrese λ ≥ 0.</div>'; return; }
                const kMax = Math.min(200, Math.max(10, Math.ceil(lambda + 5*Math.sqrt(Math.max(lambda,1)))));
                const labels = [];
                const data = [];
                for(let k=0;k<=kMax;k++){ labels.push(String(k)); data.push(Number((poissonPMF(lambda,k)).toFixed(8))); }
                if (poiChart) poiChart.destroy();
                poiChart = new Chart(poiCtx, { type:'bar', data:{ labels, datasets:[{ label:`Poisson(λ=${lambda})`, data, backgroundColor:'rgba(0,150,136,0.75)'}] }, options:{ plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } } });
                poiResult.innerHTML = `<div class='text-success'>Gráfica PMF para \(Poisson(\lambda=${lambda})\)</div>`; setHtmlLatexSafe(poiResult, poiResult.innerHTML);
            });
        }
        
        // ---------------- Continuous distributions: Exponential & Normal ----------------
        // Exponential helpers
        const expLambda = document.getElementById('exp-lambda');
        const expType = document.getElementById('exp-type');
        const expX = document.getElementById('exp-x');
        const expA = document.getElementById('exp-a');
        const expB = document.getElementById('exp-b');
        const expCalc = document.getElementById('exp-calc');
        const expPlot = document.getElementById('exp-plot');
        const expResult = document.getElementById('exp-result');
        const expExplain = document.getElementById('exp-explain');
        const expCanvas = document.getElementById('expChart');
        const expCtx = expCanvas ? expCanvas.getContext('2d') : null;
        let expChart = null;

        function expPDF(lambda,x){ if (x < 0) return 0; return lambda * Math.exp(-lambda * x); }
        function expCDF(lambda,x){ if (x < 0) return 0; return 1 - Math.exp(-lambda * x); }

        if (expCalc && expLambda && expType && expX && expA && expB && expResult){
            expCalc.addEventListener('click', function(){
                const lambda = Number(expLambda.value);
                const type = expType.value;
                const x = Number(expX.value);
                const a = Number(expA.value);
                const b = Number(expB.value);
                if (isNaN(lambda) || lambda <= 0){ expResult.innerHTML = '<div class="text-danger">Ingrese λ > 0.</div>'; return; }
                let prob = 0; let theory = 'Exponencial: tiempos entre eventos en un proceso Poisson con tasa \(\lambda\).';
                let formula = `\\(F(x)=1-e^{-\\lambda x}\\)`;
                let steps = '';
                if (type === 'less'){
                    prob = expCDF(lambda, x);
                    steps = `\\(P(X < ${x}) = 1 - e^{- ${lambda} \cdot ${x}} = ${prob.toFixed(6)}\\)`;
                } else if (type === 'greater'){
                    prob = 1 - expCDF(lambda, x);
                    steps = `\\(P(X > ${x}) = e^{- ${lambda} \cdot ${x}} = ${prob.toFixed(6)}\\)`;
                } else {
                    // between
                    if (b <= a){ expResult.innerHTML = '<div class="text-danger">Req: b > a.</div>'; return; }
                    prob = expCDF(lambda, b) - expCDF(lambda, a);
                    steps = `\\(P(${a} < X < ${b}) = e^{- ${lambda} ${a}} - e^{- ${lambda} ${b}} = ${prob.toFixed(6)}\\)`;
                }
                const numeric = `\\(P = ${prob.toFixed(6)}\\)`;
                const interp = `Probabilidad calculada: ${prob.toFixed(6)}.`;
                renderDetailedAnswer(expResult, expExplain, theory, formula, steps, numeric, interp);
            });
        }

        if (expPlot && expLambda && expCtx){
            expPlot.addEventListener('click', function(){
                const lambda = Number(expLambda.value);
                if (isNaN(lambda) || lambda <= 0){ expResult.innerHTML = '<div class="text-danger">Ingrese λ > 0.</div>'; return; }
                // choose xmax = max(5/lambda, provided x*2)
                const xVal = Number(expX.value || 0);
                const xmax = Math.max(5 / lambda, xVal * 2 || 5);
                const nPoints = 200;
                const labels = []; const data = [];
                for(let i=0;i<=nPoints;i++){ const xv = xmax * (i / nPoints); labels.push(xv.toFixed(2)); data.push(Number(expPDF(lambda, xv).toFixed(8))); }
                if (expChart) expChart.destroy();
                expChart = new Chart(expCtx, { type: 'line', data:{ labels, datasets:[{ label:`Exp(λ=${lambda}) PDF`, data, borderColor:'rgba(13,110,253,0.9)', backgroundColor:'rgba(13,110,253,0.12)', fill:true, pointRadius:0 }] }, options:{ plugins:{ legend:{display:false} }, scales:{ x:{ display:true, title:{ display:true, text:'x' } }, y:{ beginAtZero:true } } } });
                expResult.innerHTML = `<div class='text-success'>Densidad para Exponencial \(\lambda=${lambda}\).</div>`; setHtmlLatexSafe(expResult, expResult.innerHTML);
            });
        }

        // Exponential quick-fill example
        const expFill = document.getElementById('exp-fill');
        if (expFill && expLambda && expType && expX && expA && expB){
            expFill.addEventListener('click', function(){
                // ejemplo: tiempos promedio 2 (λ = 0.5), calcular P(1 < X < 3)
                expLambda.value = 0.5; expType.value = 'between'; expX.value = 2; expA.value = 1; expB.value = 3;
                // trigger calc and plot for immediate feedback
                if (typeof expCalc !== 'undefined' && expCalc) expCalc.click();
                if (typeof expPlot !== 'undefined' && expPlot) expPlot.click();
            });
        }

        // Normal helpers (standard normal via erf approximation)
        function erf(x){ // Abramowitz and Stegun approximation
            // save sign
            const sign = (x >= 0) ? 1 : -1; x = Math.abs(x);
            const a1=  0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
            const t = 1.0/(1.0 + p*x);
            const y = 1.0 - ((((a5*t + a4)*t) + a3)*t + a2)*t*a1*t*Math.exp(-x*x); // simplified polynomial mul
            // Use more stable implementation
            const approx = 1 - (a1*t + a2*t*t + a3*Math.pow(t,3) + a4*Math.pow(t,4) + a5*Math.pow(t,5)) * Math.exp(-x*x);
            return sign * approx;
        }
        function standardNormalCDF(z){ return 0.5 * (1 + erf(z / Math.sqrt(2))); }
        function normalPDF(x, mu, sigma){ return (1/(sigma * Math.sqrt(2*Math.PI))) * Math.exp(-0.5 * Math.pow((x-mu)/sigma,2)); }
        function normalCDF(x, mu, sigma){ return standardNormalCDF((x - mu)/sigma); }
        function normalQuantile(p, mu, sigma){ // simple binary search
            if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
            let lo = mu - 10 * sigma, hi = mu + 10 * sigma;
            for(let i=0;i<60;i++){ const mid = (lo+hi)/2; const v = normalCDF(mid, mu, sigma); if (v < p) lo = mid; else hi = mid; }
            return (lo+hi)/2;
        }

        // Normal UI
        const normMu = document.getElementById('norm-mu');
        const normSigma = document.getElementById('norm-sigma');
        const normType = document.getElementById('norm-type');
        const normX = document.getElementById('norm-x');
        const normA = document.getElementById('norm-a');
        const normB = document.getElementById('norm-b');
        const normCalc = document.getElementById('norm-calc');
        const normPlot = document.getElementById('norm-plot');
        const normResult = document.getElementById('norm-result');
        const normExplain = document.getElementById('norm-explain');
        const normCanvas = document.getElementById('normChart');
        const normCtx = normCanvas ? normCanvas.getContext('2d') : null;
        let normChart = null;

        if (normCalc && normMu && normSigma && normType && normX && normA && normB && normResult){
            normCalc.addEventListener('click', function(){
                const mu = Number(normMu.value); const sigma = Number(normSigma.value);
                const type = normType.value; const x = Number(normX.value); const a = Number(normA.value); const b = Number(normB.value);
                if (isNaN(mu) || isNaN(sigma) || sigma <= 0){ normResult.innerHTML = '<div class="text-danger">Verifique μ y σ > 0.</div>'; return; }
                let prob = 0; let theory = 'Distribución Normal: densidad gaussiana, estandarización Z = (X - μ)/σ.';
                let formula = `\\(Z=\\dfrac{X-\\mu}{\\sigma},\\quad P(X\\le x)=\\Phi\\left(\\dfrac{x-\\mu}{\\sigma}\\right)\\)`;
                let steps = '';
                if (type === 'less'){
                    prob = normalCDF(x, mu, sigma);
                    steps = `\\(Z=\\dfrac{${x}-${mu}}{${sigma}} = ${( (x-mu)/sigma ).toFixed(4)};\\quad P(X<${x})=\\Phi(${((x-mu)/sigma).toFixed(4)}) = ${prob.toFixed(6)}\\)`;
                } else if (type === 'greater'){
                    prob = 1 - normalCDF(x, mu, sigma);
                    steps = `\\(P(X>${x}) = 1 - \\Phi\\left(${((x-mu)/sigma).toFixed(4)}\\right) = ${prob.toFixed(6)}\\)`;
                } else if (type === 'between'){
                    if (b <= a){ normResult.innerHTML = '<div class="text-danger">Req: b > a.</div>'; return; }
                    prob = normalCDF(b, mu, sigma) - normalCDF(a, mu, sigma);
                    steps = `\\(P(${a}<X<${b}) = \\Phi\\left(${((b-mu)/sigma).toFixed(4)}\\right) - \\Phi\\left(${((a-mu)/sigma).toFixed(4)}\\right) = ${prob.toFixed(6)}\\)`;
                } else if (type === 'inverse'){
                    const p = Number(normX.value);
                    if (isNaN(p) || p<=0 || p>=1){ normResult.innerHTML = '<div class="text-danger">Ingrese 0 < P < 1 para la inversa.</div>'; return; }
                    const xval = normalQuantile(p, mu, sigma);
                    prob = p;
                    steps = `\\(x = \\mu + \\sigma z,\\; z = \\Phi^{-1}(${p.toFixed(6)}) \\ Rightarrow x = ${xval.toFixed(4)}\\)`;
                    renderDetailedAnswer(normResult, normExplain, theory, formula, steps, `\\(x = ${xval.toFixed(4)}\\)`, `Valor tal que P(X \le x) = ${p.toFixed(6)}.`);
                    return;
                }
                const numeric = `\\(P = ${prob.toFixed(6)}\\)`;
                renderDetailedAnswer(normResult, normExplain, theory, formula, steps, numeric, `Probabilidad calculada: ${prob.toFixed(6)}.`);
            });
        }

        if (normPlot && normMu && normSigma && normCtx){
            normPlot.addEventListener('click', function(){
                const mu = Number(normMu.value); const sigma = Number(normSigma.value);
                if (isNaN(mu) || isNaN(sigma) || sigma <= 0){ normResult.innerHTML = '<div class="text-danger">Verifique μ y σ.</div>'; return; }
                const xmin = mu - 4 * sigma; const xmax = mu + 4 * sigma; const nPoints = 200;
                const labels = []; const data = [];
                for(let i=0;i<=nPoints;i++){ const xv = xmin + (xmax - xmin) * (i / nPoints); labels.push(xv.toFixed(2)); data.push(Number(normalPDF(xv, mu, sigma).toFixed(8))); }
                if (normChart) normChart.destroy();
                normChart = new Chart(normCtx, { type:'line', data:{ labels, datasets:[{ label:`N(${mu},${sigma}^2)`, data, borderColor:'rgba(0,150,136,0.9)', backgroundColor:'rgba(0,150,136,0.12)', fill:true, pointRadius:0 }] }, options:{ plugins:{ legend:{display:false} }, scales:{ x:{ display:true, title:{ display:true, text:'x' } }, y:{ beginAtZero:false } } } });
                normResult.innerHTML = `<div class='text-success'>Densidad Normal \(\\mu=${mu},\\;\\sigma=${sigma}\).</div>`; setHtmlLatexSafe(normResult, normResult.innerHTML);
            });
        }

        // Normal quick-fill example
        const normFill = document.getElementById('norm-fill');
        if (normFill && normMu && normSigma && normType && normX && normA && normB){
            normFill.addEventListener('click', function(){
                // ejemplo clásico: μ=0, σ=1, calcular P(X < 1.96)
                normMu.value = 0; normSigma.value = 1; normType.value = 'less'; normX.value = 1.96; normA.value = -1; normB.value = 1;
                if (typeof normCalc !== 'undefined' && normCalc) normCalc.click();
                if (typeof normPlot !== 'undefined' && normPlot) normPlot.click();
            });
        }
        
        // ---------------- Conditional probability / contingency table ----------------
        const c_a_b = document.getElementById('c_a_b');
        const c_a_nb = document.getElementById('c_a_nb');
        const c_na_b = document.getElementById('c_na_b');
        const c_na_nb = document.getElementById('c_na_nb');
        const c_a_total = document.getElementById('c_a_total');
        const c_na_total = document.getElementById('c_na_total');
        const c_b_total = document.getElementById('c_b_total');
        const c_nb_total = document.getElementById('c_nb_total');
        const c_total = document.getElementById('c_total');
        const tableCalc = document.getElementById('table-calc');
        const condCalc = document.getElementById('cond-calc');
        const indepCheck = document.getElementById('indep-check');
        const tableResult = document.getElementById('table-result');
        const condResult = document.getElementById('cond-result');
        const condExplain = document.getElementById('cond-explain');
        const condInterpret = document.getElementById('cond-interpret');
        const fillExample = document.getElementById('fill-example');

        function computeContingency(){
            const a_b = Number(c_a_b?.value || 0);
            const a_nb = Number(c_a_nb?.value || 0);
            const na_b = Number(c_na_b?.value || 0);
            const na_nb = Number(c_na_nb?.value || 0);
            if ([a_b,a_nb,na_b,na_nb].some(x => !Number.isFinite(x) || x<0 || !Number.isInteger(x))){
                tableResult.innerHTML = '<div class="text-danger">Ingrese conteos enteros ≥ 0.</div>'; return null;
            }
            const a_tot = a_b + a_nb;
            const na_tot = na_b + na_nb;
            const b_tot = a_b + na_b;
            const nb_tot = a_nb + na_nb;
            const total = a_tot + na_tot;
            if (c_a_total) c_a_total.textContent = a_tot;
            if (c_na_total) c_na_total.textContent = na_tot;
            if (c_b_total) c_b_total.textContent = b_tot;
            if (c_nb_total) c_nb_total.textContent = nb_tot;
            if (c_total) c_total.textContent = total;
            tableResult.innerHTML = `<div class="text-success">Tabla procesada. Total = ${total} observaciones.</div>`;
            return {a_b,a_nb,na_b,na_nb,a_tot,na_tot,b_tot,nb_tot,total};
        }

        if (tableCalc && c_a_b){
            tableCalc.addEventListener('click', function(){ computeContingency(); });
        }

        if (condCalc && c_a_b){
            condCalc.addEventListener('click', function(){
                const t = computeContingency(); if (!t) return;
                const {a_b,a_nb,na_b,na_nb,a_tot,na_tot,b_tot,nb_tot,total} = t;
                if (total === 0){ condResult.innerHTML = '<div class="text-danger">Total = 0, no hay datos.</div>'; return; }
                const pA = a_tot / total;
                const pB = b_tot / total;
                const pAB = a_b / total;
                const theory = 'Probabilidad condicional: P(A|B) = P(A∩B)/P(B).';
                const formula = `\\(P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)},\\quad P(B\\mid A)=\\dfrac{P(A\\cap B)}{P(A)}\\)`;
                const steps = `\\(P(A)=\\dfrac{${a_tot}}{${total}}=${pA.toFixed(6)};\\quad P(B)=\\dfrac{${b_tot}}{${total}}=${pB.toFixed(6)};\\quad P(A\\cap B)=\\dfrac{${a_b}}{${total}}=${pAB.toFixed(6)}\\)`;
                let numeric = '';
                let interp = '';
                // compute conditional safely
                if (pB === 0){
                    numeric += `\\(P(A\\mid B) \\;\text{indefinida (}P(B)=0)\\)`;
                    interp += 'P(B)=0, por lo que P(A|B) no está definida.';
                } else {
                    const pA_given_B = pAB / pB;
                    numeric += `\\(P(A\\mid B) = ${pA_given_B.toFixed(6)}\\)`;
                    interp += `P(A|B) = ${pA_given_B.toFixed(6)}.`;
                }
                if (pA === 0){
                    numeric += `\\\quad P(B\\mid A) \\;\text{indefinida (}P(A)=0)\\)`;
                    interp += ' P(A)=0, por lo que P(B|A) no está definida.';
                } else {
                    const pB_given_A = pAB / pA;
                    numeric += `\\quad P(B\\mid A) = ${pB_given_A.toFixed(6)}\\)`;
                    interp += ` P(B|A) = ${pB_given_A.toFixed(6)}.`;
                }
                // Diagnostics: check independence
                if (approxEqual(pAB, pA * pB)){
                    interp += ' Diagnóstico: P(A∩B) ≈ P(A)P(B) → A y B podrían ser independientes.';
                } else {
                    interp += ' Diagnóstico: P(A∩B) ≠ P(A)P(B) → A y B son dependientes.';
                }
                // Diagnostics: check independence
                if (approxEqual(pAB, pA * pB)){
                    interp += ' Diagnóstico: P(A∩B) ≈ P(A)P(B) → A y B podrían ser independientes.';
                } else {
                    interp += ' Diagnóstico: P(A∩B) ≠ P(A)P(B) → A y B son dependientes.';
                }
                renderDetailedAnswer(condResult, condExplain, theory, formula, steps, numeric, interp);
                if (condInterpret) condInterpret.textContent = 'Se calcularon probabilidades condicionales y diagnóstico de dependencia.';
            });
        }

        if (indepCheck && c_a_b){
            indepCheck.addEventListener('click', function(){
                const t = computeContingency(); if (!t) return;
                const {a_b,a_nb,na_b,na_nb,a_tot,na_tot,b_tot,nb_tot,total} = t;
                if (total === 0){ tableResult.innerHTML = '<div class="text-danger">Total = 0, no hay datos.</div>'; return; }
                const pA = a_tot / total; const pB = b_tot / total; const pAB = a_b / total;
                const theory = 'Independencia: A y B son independientes si P(A∩B)=P(A)P(B).';
                const formula = `\\(P(A\\cap B)=P(A)P(B)\\)`;
                const steps = `\\(P(A)=${pA.toFixed(6)},\\; P(B)=${pB.toFixed(6)},\\; P(A\\cap B)=${pAB.toFixed(6)}\\)`;
                const numeric = '';
                let interp = '';
                if (approxEqual(pAB, pA * pB)) interp = `Se cumple aproxim. independencia (P(A\\cap B) ≈ P(A)P(B)).`;
                else interp = `No hay independencia: P(A\\cap B) ≠ P(A)P(B).`;
                renderDetailedAnswer(tableResult, condExplain, theory, formula, steps, numeric, interp);
            });
        }

        if (fillExample && c_a_b){
            fillExample.addEventListener('click', function(){
                // ejemplo: enfermedad y prueba (sensibilidad/especificidad)
                c_a_b.value = 80; // A and B
                c_a_nb.value = 20; // A and not B
                c_na_b.value = 10; // not A and B
                c_na_nb.value = 890; // not A and not B
                computeContingency();
                condInterpret.textContent = 'Ejemplo cargado: diagnóstico (A=Enfermo, B=Test positivo).';
            });
        }

        // ---------------- Bayes theorem interactive ----------------
        const bayesPrior = document.getElementById('bayes-prior');
        const bayesSens = document.getElementById('bayes-sens');
        const bayesSpec = document.getElementById('bayes-spec');
        const bayesResultSelect = document.getElementById('bayes-result-select');
        const bayesCalc = document.getElementById('bayes-calc');
        const bayesFill = document.getElementById('bayes-fill');
        const bayesResult = document.getElementById('bayes-result');
        const bayesExplain = document.getElementById('bayes-explain');

    if (bayesCalc && bayesPrior && bayesSens && bayesSpec && bayesResultSelect){
            bayesCalc.addEventListener('click', function(){
                const prior = Number(bayesPrior.value);
                const sens = Number(bayesSens.value);
                const spec = Number(bayesSpec.value);
                const outcome = bayesResultSelect.value; // 'pos' or 'neg'
                if ([prior,sens,spec].some(x => isNaN(x) || x<0 || x>1)){
                    bayesResult.innerHTML = '<div class="text-danger">Ingrese valores entre 0 y 1 para prevalencia, sensibilidad y especificidad.</div>'; return;
                }
                const pD = prior;
                const pNotD = 1 - pD;
                const pPosGivenD = sens;
                const pNegGivenNotD = spec;
                const pPosGivenNotD = 1 - spec;
                const pNegGivenD = 1 - sens;

                let numerator = 0;
                let denominator = 0;
                let theory = '';
                let formula = '';
                let steps = '';
                let numeric = '';
                let interp = '';

                if (outcome === 'pos'){
                    // P(D|+) = P(+|D)P(D) / (P(+|D)P(D) + P(+|¬D)P(¬D))
                    numerator = pPosGivenD * pD;
                    denominator = numerator + pPosGivenNotD * pNotD;
                    theory = 'Teorema de Bayes aplicado a un test: actualiza la probabilidad de enfermedad tras un resultado positivo.';
                    formula = `\\(P(D\\mid +)=\\dfrac{P(+\\mid D)P(D)}{P(+\\mid D)P(D)+P(+\\mid \\lnot D)P(\\lnot D)}\\)`;
                    steps = `\\(P(+\\mid D)P(D) = ${pPosGivenD.toFixed(6)}\\cdot${pD.toFixed(6)} = ${numerator.toFixed(6)};\\quad P(+\\mid \\u00ac D)P(\\u00ac D) = ${pPosGivenNotD.toFixed(6)}\\cdot${pNotD.toFixed(6)} = ${ (pPosGivenNotD * pNotD).toFixed(6) }\\)`;
                } else {
                    // P(D|-) = P(-|D)P(D) / (P(-|D)P(D) + P(-|¬D)P(¬D))
                    numerator = pNegGivenD * pD;
                    denominator = numerator + pNegGivenNotD * pNotD;
                    theory = 'Teorema de Bayes aplicado a un resultado negativo: probabilidad posterior tras evidencia negativa.';
                    formula = `\\(P(D\\mid -)=\\dfrac{P(-\\mid D)P(D)}{P(-\\mid D)P(D)+P(-\\mid \\lnot D)P(\\lnot D)}\\)`;
                    steps = `\\(P(-\\mid D)P(D) = ${pNegGivenD.toFixed(6)}\\cdot${pD.toFixed(6)} = ${numerator.toFixed(6)};\\quad P(-\\mid \\u00ac D)P(\\u00ac D) = ${pNegGivenNotD.toFixed(6)}\\cdot${pNotD.toFixed(6)} = ${ (pNegGivenNotD * pNotD).toFixed(6) }\\)`;
                }

                if (denominator === 0){
                    numeric = '\\(\text{Indefinido — denominador = 0}\\)';
                    interp = 'Denominador cero: revise las probabilidades (p. ej. prevalencia y tasas iguales a 0).';
                } else {
                    const posterior = numerator / denominator;
                    numeric = `\\(P(D\\mid ${outcome === 'pos' ? '+' : '-'}) = ${posterior.toFixed(6)}\\)`;
                    interp = `Posterior: P(D\\mid ${outcome === 'pos' ? '+' : '-'}) = ${posterior.toFixed(6)}. `;
                    interp += `Verdaderos ${outcome === 'pos' ? 'positivos' : 'negativos'} aportan ${numerator.toFixed(6)}; otros casos aportan ${(denominator - numerator).toFixed(6)}.`;
                }
                renderDetailedAnswer(bayesResult, bayesExplain, theory, formula, steps, numeric, interp);
            });
        }

        if (bayesFill && bayesPrior){
            bayesFill.addEventListener('click', function(){
                // ejemplo clásico: prevalencia 1%, sensibilidad 95%, especificidad 98%
                bayesPrior.value = 0.01;
                bayesSens.value = 0.95;
                bayesSpec.value = 0.98;
                bayesResultSelect.value = 'pos';
                bayesCalc.click();
            });
        }

        // Multi-hypothesis Bayes: dynamic rows, calculate posteriors with chart and optional tree
        const bayesAdd = document.getElementById('bayes-add');
        const bayesMultiCalc = document.getElementById('bayes-multi-calc');
        const bayesChartCanvas = document.getElementById('bayesChart');
        const bayesTree = document.getElementById('bayes-tree');
        let bayesChart = null;

        function getHypothesesFromTable(){
            const rows = Array.from(document.querySelectorAll('#bayes-hyp-table tbody tr'));
            const hyps = rows.map(r => {
                const name = r.querySelector('.hyp-name')?.value || 'H';
                const prior = Number(r.querySelector('.hyp-prior')?.value || 0);
                const like = Number(r.querySelector('.hyp-like')?.value || 0);
                return {name, prior, like, row: r};
            });
            return hyps;
        }

        function removeRowHandler(btn){
            btn.addEventListener('click', function(){ btn.closest('tr')?.remove(); });
        }

        // attach existing remove buttons
        Array.from(document.querySelectorAll('.bayes-remove-row')).forEach(removeRowHandler);

        if (bayesAdd){
            bayesAdd.addEventListener('click', function(){
                const tbody = document.querySelector('#bayes-hyp-table tbody');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><input class="form-control form-control-sm hyp-name" value="H${Date.now()%1000}"></td>`+
                               `<td><input class="form-control form-control-sm hyp-prior" type="number" value="0.1" step="0.01" min="0" max="1"></td>`+
                               `<td><input class="form-control form-control-sm hyp-like" type="number" value="0.1" step="0.01" min="0" max="1"></td>`+
                               `<td><button class="btn btn-sm btn-danger bayes-remove-row">Eliminar</button></td>`;
                tbody.appendChild(tr);
                removeRowHandler(tr.querySelector('.bayes-remove-row'));
            });
        }

        function drawBayesChart(labels, values){
            if (!bayesChartCanvas) return;
            const ctx = bayesChartCanvas.getContext('2d');
            if (bayesChart) bayesChart.destroy();
            bayesChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Posterior', data: values, backgroundColor: 'rgba(13,110,253,0.8)' }] }, options: { plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, max:1 } } } });
        }

        function renderBayesTreeBinary(pD, sens, spec, N=10000){
            // SVG probability tree (curved branches) for binary diagnostic example
            // pD : prior of disease; sens: P(+|D); spec: P(-|¬D)
            const nD = Math.round(pD * N);
            const nNotD = N - nD;
            const tp = Math.round(sens * nD);
            const fn = nD - tp;
            const tn = Math.round(spec * nNotD);
            const fp = nNotD - tn;
            if (!bayesTree) return;
            // larger canvas and right padding so labels don't get cut off
            const width = 820; const height = 300;
            const leftX = 40; const midX = 360; const rightX = 720;
            const topY = 40; const gapY = 100;

            // formatted strings
            const pDstr = pD.toFixed(3);
            const pNotDstr = (1 - pD).toFixed(3);
            // counts and conditional probabilities on branches
            const sensStr = sens.toFixed(3);
            const oneMinusSensStr = (1 - sens).toFixed(3);
            const fpRate = (1 - spec);
            const fpRateStr = fpRate.toFixed(3);
            const specStr = spec.toFixed(3);

            const parts = [];
            parts.push(`<div style="overflow:auto"><svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}px" role="img" aria-label="Árbol de probabilidades">`);

            // helper to draw a smooth cubic curve from (x1,y1) to (x2,y2)
            const curveD = (x1,y1,x2,y2) => `M ${x1} ${y1} C ${x1 + 140} ${y1} ${x2 - 140} ${y2} ${x2} ${y2}`;

            // root
            const rootY = topY + gapY/2;
            parts.push(`<circle cx='${leftX}' cy='${rootY}' r='8' fill='#1f77b4' stroke='#0b6bbf'></circle>`);
            parts.push(`<text x='${leftX + 12}' y='${rootY + 4}' font-size='12' fill='#111'>P(root)=1.00</text>`);

            // split to D and ¬D (mid nodes)
            const a1Y = topY; const a2Y = topY + gapY;
            // paths from root to mid nodes
            parts.push(`<path d='${curveD(leftX, rootY, midX, a1Y)}' stroke='#444' stroke-width='2' fill='none'/>`);
            parts.push(`<path d='${curveD(leftX, rootY, midX, a2Y)}' stroke='#444' stroke-width='2' fill='none'/>`);

            // mid nodes
            parts.push(`<circle cx='${midX}' cy='${a1Y}' r='7' fill='#ffd966' stroke='#b8860b'></circle>`);
            parts.push(`<text x='${midX - 8}' y='${a1Y - 12}' font-size='12' fill='#333'>D</text>`);
            parts.push(`<text x='${midX + 12}' y='${a1Y - 12}' font-size='12' fill='#333'>P=${pDstr}, n=${nD}</text>`);

            parts.push(`<circle cx='${midX}' cy='${a2Y}' r='7' fill='#ffd966' stroke='#b8860b'></circle>`);
            parts.push(`<text x='${midX - 16}' y='${a2Y + 24}' font-size='12' fill='#333'>¬D</text>`);
            parts.push(`<text x='${midX + 12}' y='${a2Y + 24}' font-size='12' fill='#333'>P=${pNotDstr}, n=${nNotD}</text>`);

            // branches from D to outcomes (+ and -)
            const xA1 = midX; const xOpt = rightX;
            const optTop = a1Y - 16;
            const optBottom = a1Y + 24;
            // D -> + (true positive)
            parts.push(`<path d='${curveD(xA1, a1Y, xOpt, optTop)}' stroke='#d1453b' stroke-width='2' fill='none'/>`);
            const tpLabel = `P= ${sensStr}, n=${tp}`;
            // place probability label near midpoint (approx)
            parts.push(`<text x='${(xA1 + xOpt)/2 - 40}' y='${(a1Y + optTop)/2 - 4}' font-size='12' fill='#111'>${tpLabel}</text>`);
            parts.push(`<circle cx='${xOpt}' cy='${optTop}' r='6' fill='#fff' stroke='#1f77b4'></circle>`);
            parts.push(`<text x='${xOpt + 10}' y='${optTop + 4}' font-size='12' fill='#111'>+ (TP)</text>`);

            // D -> - (false negative)
            parts.push(`<path d='${curveD(xA1, a1Y, xOpt, optBottom)}' stroke='#a84b3b' stroke-width='2' fill='none'/>`);
            const fnLabel = `P= ${oneMinusSensStr}, n=${fn}`;
            parts.push(`<text x='${(xA1 + xOpt)/2 - 40}' y='${(a1Y + optBottom)/2 + 12}' font-size='12' fill='#111'>${fnLabel}</text>`);
            parts.push(`<circle cx='${xOpt}' cy='${optBottom}' r='6' fill='#fff' stroke='#1f77b4'></circle>`);
            parts.push(`<text x='${xOpt + 10}' y='${optBottom + 4}' font-size='12' fill='#111'>- (FN)</text>`);

            // branches from ¬D to outcomes (+ and -)
            const a2optTop = a2Y - 16; const a2optBottom = a2Y + 24;
            // ¬D -> + (false positive)
            parts.push(`<path d='${curveD(xA1, a2Y, xOpt, a2optTop)}' stroke='#2b6f3a' stroke-width='2' fill='none'/>`);
            const fpLabel = `P= ${fpRateStr}, n=${fp}`;
            parts.push(`<text x='${(xA1 + xOpt)/2 - 40}' y='${(a2Y + a2optTop)/2 - 4}' font-size='12' fill='#111'>${fpLabel}</text>`);
            parts.push(`<circle cx='${xOpt}' cy='${a2optTop}' r='6' fill='#fff' stroke='#1f77b4'></circle>`);
            parts.push(`<text x='${xOpt + 10}' y='${a2optTop + 4}' font-size='12' fill='#111'>+ (FP)</text>`);

            // ¬D -> - (true negative)
            parts.push(`<path d='${curveD(xA1, a2Y, xOpt, a2optBottom)}' stroke='#2b6f3a' stroke-width='2' fill='none'/>`);
            const tnLabel = `P= ${specStr}, n=${tn}`;
            parts.push(`<text x='${(xA1 + xOpt)/2 - 40}' y='${(a2Y + a2optBottom)/2 + 12}' font-size='12' fill='#111'>${tnLabel}</text>`);
            parts.push(`<circle cx='${xOpt}' cy='${a2optBottom}' r='6' fill='#fff' stroke='#1f77b4'></circle>`);
            parts.push(`<text x='${xOpt + 10}' y='${a2optBottom + 4}' font-size='12' fill='#111'>- (TN)</text>`);

            parts.push('</svg></div>');

            // numeric summary (show counts and posterior for +)
            const positives = tp + fp;
            const posteriorPos = positives > 0 ? (tp / positives) : 0;
            const summary = `<div class="mt-2 small">Muestra ~${N} individuos — VP=${tp}, FP=${fp}, VN=${tn}, FN=${fn} — P(D|+) ≈ ${posteriorPos.toFixed(6)}</div>`;
            bayesTree.innerHTML = parts.join('\n') + summary;
        }

        if (bayesMultiCalc){
            bayesMultiCalc.addEventListener('click', function(){
                const hyps = getHypothesesFromTable();
                if (hyps.length === 0){ alert('Agregue al menos una hipótesis.'); return; }
                // validate priors sum > 0
                const priorsSum = hyps.reduce((s,h)=>s + (isFinite(h.prior) ? h.prior : 0), 0);
                if (priorsSum <= 0){ alert('La suma de priors debe ser > 0.'); return; }
                // normalize priors if they don't sum to 1
                const hypsNorm = hyps.map(h => ({...h, prior: h.prior / priorsSum}));
                // compute numerators and denominator
                const numerators = hypsNorm.map(h => h.like * h.prior);
                const denom = numerators.reduce((s,x) => s + x, 0);
                const labels = hypsNorm.map(h => h.name);
                const posteriors = numerators.map(n => denom === 0 ? 0 : n/denom);

                // build LaTeX steps
                const theory = 'Bayes multi-hipótesis: actualizar priors con likelihoods para obtener posteriors.';
                let formula = `\\(P(H_j\\mid E)=\\dfrac{P(E\\mid H_j)P(H_j)}{\\sum_{i} P(E\\mid H_i)P(H_i)}\\)`;
                let steps = '';
                hypsNorm.forEach((h,i)=>{
                    steps += `\\(${h.name}: P(E\\mid ${h.name})P(${h.name}) = ${h.like.toFixed(6)}\\cdot${h.prior.toFixed(6)} = ${numerators[i].toFixed(6)}\\) \\n+                    `;
                });
                steps += `\\(Denominador = ${denom.toFixed(6)}\\)`;
                let numeric = '';
                hypsNorm.forEach((h,i)=>{ numeric += `\\(P(${h.name}\\mid E) = ${posteriors[i].toFixed(6)}\\) \\ `; });
                let interp = 'Posteriors calculados y graficados.';

                renderDetailedAnswer(document.getElementById('bayes-result'), document.getElementById('bayes-explain'), theory, formula, steps, numeric, interp);
                drawBayesChart(labels, posteriors);

                // optional tree: if exactly two hypotheses and user requested, and if they correspond to disease/no disease we can show counts
                const showTree = document.getElementById('bayes-show-tree')?.checked;
                if (showTree && hypsNorm.length === 2){
                    // pick the first as D and second as not-D for counting
                    const pD = hypsNorm[0].prior;
                    // we'll use sens/ spec from main inputs if present
                    const sens = Number(bayesSens?.value || 0.95);
                    const spec = Number(bayesSpec?.value || 0.98);
                    renderBayesTreeBinary(pD, sens, spec, 10000);
                } else if (showTree){
                    bayesTree.innerHTML = '<div class="text-muted small">Árbol solo disponible para caso binario; calcule con exactamente 2 hipótesis.</div>';
                }
            });
        }
            // ---------------- Basic probability interactives ----------------
            const pbFav = document.getElementById('pb-fav');
            const pbPos = document.getElementById('pb-pos');
            const pbCalc = document.getElementById('pb-calc');
            const pbResult = document.getElementById('pb-result');

            if (pbCalc && pbFav && pbPos && pbResult){
                pbCalc.addEventListener('click', function(){
                    const fav = Number(pbFav.value);
                    const pos = Number(pbPos.value);
                    if (!Number.isFinite(fav) || !Number.isFinite(pos) || pos <= 0 || fav < 0){
                        pbResult.innerHTML = '<div class="text-danger">Verifique los casos favorables y posibles (posible > 0).</div>'; return;
                    }
                    const prob = fav / pos;
                    const theory = 'Regla clásica: la probabilidad se calcula como el cociente entre casos favorables y casos posibles.';
                    const formula = `\\(P=\\dfrac{\\text{favorables}}{\\text{posibles}}\\)`;
                    const steps = `\\(P=\\dfrac{${fav}}{${pos}} = ${prob.toFixed(6)}\\)`;
                    const numeric = `\\(P=${prob.toFixed(6)}\\)`;
                    const interpText = `En este caso hay ${fav} casos favorables de ${pos} posibles; P = ${prob.toFixed(6)}.`;
                    renderDetailedAnswer(pbResult, pbExplain, theory, formula, steps, numeric, interpText);
                });
            }

            // Complement
            const compP = document.getElementById('comp-p');
            const compCalc = document.getElementById('comp-calc');
            const compResult = document.getElementById('comp-result');
            if (compCalc && compP && compResult){
                compCalc.addEventListener('click', function(){
                    const p = Number(compP.value);
                    if (isNaN(p) || p < 0 || p > 1){ compResult.innerHTML = '<div class="text-danger">Ingrese 0 ≤ P(A) ≤ 1.</div>'; return; }
                    const c = 1 - p;
                    const theory = 'Complemento: la probabilidad de que no ocurra A es 1 menos la probabilidad de A.';
                    const formula = `\\(P(\\overline{A}) = 1 - P(A)\\)`;
                    const steps = `\\(P(\\overline{A}) = 1 - ${p.toFixed(4)} = ${c.toFixed(6)}\\)`;
                    const numeric = `\\(P(\\overline{A}) = ${c.toFixed(6)}\\)`;
                    const interpText = `Si P(A) = ${p.toFixed(4)}, entonces la probabilidad de su complemento es ${c.toFixed(6)}.`;
                    renderDetailedAnswer(compResult, compExplain, theory, formula, steps, numeric, interpText);
                });
            }

            // Sum / Union
            const sumPa = document.getElementById('sum-pa');
            const sumPb = document.getElementById('sum-pb');
            const sumPab = document.getElementById('sum-pab');
            const sumCalc = document.getElementById('sum-calc');
            const sumResult = document.getElementById('sum-result');
            if (sumCalc && sumPa && sumPb && sumPab && sumResult){
                sumCalc.addEventListener('click', function(){
                    const pa = Number(sumPa.value); const pb = Number(sumPb.value); const pab = Number(sumPab.value);
                    if ([pa,pb,pab].some(x => isNaN(x) || x<0 || x>1)){ sumResult.innerHTML = '<div class="text-danger">Ingrese probabilidades entre 0 y 1.</div>'; return; }
                    let union = pa + pb - pab;
                    union = Math.max(0, Math.min(1, union));
                    // validation: intersection cannot exceed min(pa,pb)
                    if (pab > Math.min(pa,pb)){
                        sumResult.innerHTML = '<div class="text-danger">Error: P(A∩B) no puede ser mayor que P(A) o P(B).</div>';
                        return;
                    }
                    const theory = 'Regla de la suma (unión): resta la intersección para no contarla dos veces.';
                    const formula = `\\(P(A\\cup B) = P(A) + P(B) - P(A\\cap B)\\)`;
                    const steps = `\\(${pa.toFixed(3)} + ${pb.toFixed(3)} - ${pab.toFixed(3)} = ${union.toFixed(6)}\\)`;
                    const numeric = `\\(P(A\\cup B) = ${union.toFixed(6)}\\)`;
                    let interpText = `La unión tiene probabilidad ${union.toFixed(6)} según las probabilidades ingresadas.`;
                    // Diagnostics: exclusive or not
                    if (approxEqual(pab, 0)){
                        interpText += ' Nota: P(A∩B) ≈ 0 → A y B son excluyentes (mutuamente excluyentes).';
                    } else {
                        interpText += ' Nota: P(A∩B) > 0 → A y B no son excluyentes.';
                    }
                    renderDetailedAnswer(sumResult, sumExplain, theory, formula, steps, numeric, interpText);
                });
            }

            // Product / Independence and conditional
            const prodPaEl = document.getElementById('prod-pa');
            const prodPbEl = document.getElementById('prod-pb');
            const prodPabEl = document.getElementById('prod-pab');
            const prodIndepBtn = document.getElementById('prod-indep');
            const prodCondBtn = document.getElementById('prod-cond');
            const prodResult = document.getElementById('prod-result');
            if (prodIndepBtn && prodCondBtn && prodPaEl && prodPbEl && prodPabEl && prodResult){
                prodIndepBtn.addEventListener('click', function(){
                    const pa = Number(prodPaEl.value); const pb = Number(prodPbEl.value);
                    if ([pa,pb].some(x => isNaN(x) || x<0 || x>1)){ prodResult.innerHTML = '<div class="text-danger">Ingrese probabilidades válidas entre 0 y 1.</div>'; return; }
                    const pInter = pa * pb;
                    prodPabEl.value = pInter.toFixed(6);
                        const theory = 'Independencia: si A y B son independientes, la probabilidad conjunta es el producto de las probabilidades marginales.';
                        const formula = `\\(P(A\\cap B)=P(A)P(B)\\)`;
                        const steps = `\\(${pa.toFixed(3)}\\cdot${pb.toFixed(3)} = ${pInter.toFixed(6)}\\)`;
                        const numeric = `\\(P(A\\cap B) = ${pInter.toFixed(6)}\\)`;
                        let interpText = `Al asumir independencia se obtiene P(A∩B) = ${pInter.toFixed(6)}.`;
                        // Diagnostic: check whether user's provided values were already consistent with independence
                        const providedPab = Number(prodPabEl.value || 0);
                        if (!isNaN(providedPab) && !approxEqual(providedPab, pInter)){
                            interpText += ' (Nota: el valor anterior de P(A∩B) difería del producto de marginales.)';
                        }
                        renderDetailedAnswer(prodResult, prodExplain, theory, formula, steps, numeric, interpText);
                });

                prodCondBtn.addEventListener('click', function(){
                    const pa = Number(prodPaEl.value); const pab = Number(prodPabEl.value);
                    if (isNaN(pa) || isNaN(pab) || pa<=0){ prodResult.innerHTML = '<div class="text-danger">P(A) debe ser > 0 y P(A∩B) definido.</div>'; return; }
                    const pcond = pab / pa;
                    const theory = 'Probabilidad condicional: probabilidad de B dado que A ocurrió.';
                    const formula = `\\(P(B\\mid A)=\\dfrac{P(A\\cap B)}{P(A)}\\)`;
                    const steps = `\\(\\dfrac{${pab.toFixed(6)}}{${pa.toFixed(6)}} = ${pcond.toFixed(6)}\\)`;
                    const numeric = `\\(P(B\\mid A) = ${pcond.toFixed(6)}\\)`;
                    let interpText = `La probabilidad de B dado A es ${pcond.toFixed(6)}.`;
                    // Diagnostic: compare P(A∩B) to P(A)P(B) to suggest independence/dependence
                    const prodEstimate = pa * Number(prodPbEl.value);
                    if (approxEqual(pab, prodEstimate)){
                        interpText += ' Diagnóstico: P(A∩B) ≈ P(A)P(B) → A y B podrían ser independientes.';
                    } else {
                        interpText += ' Diagnóstico: P(A∩B) difiere de P(A)P(B) → A y B son dependientes (o hay inconsistencia).';
                    }
                    renderDetailedAnswer(prodResult, prodExplain, theory, formula, steps, numeric, interpText);
                });
            }
});
