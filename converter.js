// converter.js - විද්‍යාත්මක වර්ණ ගැන්වීම් සහිත නිවැරදි කළ සම්පූර්ණ පිටපත

let tags = [];
let attrs = [];
let isSyncing = false;
let debounceTimer; 

window.onload = function() {
    initMaps();
    
    let sinEditor = document.getElementById('editorSinhala');
    let htmlEditor = document.getElementById('editorHtml');
    let sinPre = document.getElementById('sinPre');
    let htmlPre = document.getElementById('htmlPre');
    
    let savedCode = localStorage.getItem('savedEditorCode');
    
    if (savedCode) {
        sinEditor.value = savedCode;
    } else {
        sinEditor.value = `වෙබ්පිටුව. භාෂාව="si"\nහිස.\n    මාතෘකාව.පිටුව මාතෘකාව අවසන්.\nහිස අවසන්.\nශරීරය.\n    මාතෘකාව1.ආයුබෝවන් ශ්‍රී ලංකා! මාතෘකාව1 අවසන්.\nශරීරය අවසන්.\nවෙබ්පිටුව අවසන්.`;
    }
    
    updateFromSinhala();
    
    sinEditor.addEventListener('input', () => debounce(updateFromSinhala, 300));
    htmlEditor.addEventListener('input', () => debounce(updateFromHtml, 300));
    
    sinEditor.addEventListener('scroll', () => {
        sinPre.scrollTop = sinEditor.scrollTop;
        sinPre.scrollLeft = sinEditor.scrollLeft;
        document.getElementById('gutterSinhala').scrollTop = sinEditor.scrollTop;
    });
    
    htmlEditor.addEventListener('scroll', () => {
        htmlPre.scrollTop = htmlEditor.scrollTop;
        htmlPre.scrollLeft = htmlEditor.scrollLeft;
        document.getElementById('gutterHtml').scrollTop = htmlEditor.scrollTop;
    });
};

function initMaps() {
    // සම්පූර්ණ පෙරනිමි ටැග් ලැයිස්තුව - sinhala_tag.json අනුව
    let defaultTags = [
        {u:'වෙබ්පිටුව.', h:'<html>'}, {u:'වෙබ්පිටුව අවසන්.', h:'</html>'},
        {u:'හිස.', h:'<head>'}, {u:'හිස අවසන්.', h:'</head>'},
        {u:'මාතෘකාව.', h:'<title>'}, {u:'මාතෘකාව අවසන්.', h:'</title>'},
        {u:'ශරීරය.', h:'<body>'}, {u:'ශරීරය අවසන්.', h:'</body>'},
        {u:'මාතෘකාව1.', h:'<h1>'}, {u:'මාතෘකාව1 අවසන්.', h:'</h1>'},
        {u:'මාතෘකාව2.', h:'<h2>'}, {u:'මාතෘකාව2 අවසන්.', h:'</h2>'},
        {u:'මාතෘකාව3.', h:'<h3>'}, {u:'මාතෘකාව3 අවසන්.', h:'</h3>'},
        {u:'මාතෘකාව4.', h:'<h4>'}, {u:'මාතෘකාව4 අවසන්.', h:'</h4>'},
        {u:'මාතෘකාව5.', h:'<h5>'}, {u:'මාතෘකාව5 අවසන්.', h:'</h5>'},
        {u:'මාතෘකාව6.', h:'<h6>'}, {u:'මාතෘකාව6 අවසන්.', h:'</h6>'},
        {u:'ඡේදය.', h:'<p>'}, {u:'ඡේදය අවසන්.', h:'</p>'},
        {u:'යොමුව.', h:'<a>'}, {u:'යොමුව අවසන්.', h:'</a>'},
        {u:'රූපය.', h:'<img>'},
        {u:'කොටස.', h:'<div>'}, {u:'කොටස අවසන්.', h:'</div>'},
        {u:'පරාසය.', h:'<span>'}, {u:'පරාසය අවසන්.', h:'</span>'},
        {u:'නොපිළිවෙල_ලැයිස්තුව.', h:'<ul>'}, {u:'නොපිළිවෙල_ලැයිස්තුව අවසන්.', h:'</ul>'},
        {u:'පිළිවෙල_ලැයිස්තුව.', h:'<ol>'}, {u:'පිළිවෙල_ලැයිස්තුව අවසන්.', h:'</ol>'},
        {u:'ලැයිස්තු_අයිතමය.', h:'<li>'}, {u:'ලැයිස්තු_අයිතමය අවසන්.', h:'</li>'},
        {u:'වගුව.', h:'<table>'}, {u:'වගුව අවසන්.', h:'</table>'},
        {u:'වගු_පේළිය.', h:'<tr>'}, {u:'වගු_පේළිය අවසන්.', h:'</tr>'},
        {u:'වගු_දත්ත.', h:'<td>'}, {u:'වගු_දත්ත අවසන්.', h:'</td>'},
        {u:'වගු_ශීර්ෂය.', h:'<th>'}, {u:'වගු_ශීර්ෂය අවසන්.', h:'</th>'},
        {u:'වගු_හිස.', h:'<thead>'}, {u:'වගු_හිස අවසන්.', h:'</thead>'},
        {u:'වගු_කය.', h:'<tbody>'}, {u:'වගු_කය අවසන්.', h:'</tbody>'},
        {u:'පෝරමය.', h:'<form>'}, {u:'පෝරමය අවසන්.', h:'</form>'},
        {u:'ඇතුලත්කිරීම.', h:'<input>'},
        {u:'පෙළ_ප්‍රදේශය.', h:'<textarea>'}, {u:'පෙළ_ප්‍රදේශය අවසන්.', h:'</textarea>'},
        {u:'බොත්තම.', h:'<button>'}, {u:'බොත්තම අවසන්.', h:'</button>'},
        {u:'තෝරන්න.', h:'<select>'}, {u:'තෝරන්න අවසන්.', h:'</select>'},
        {u:'විකල්පය.', h:'<option>'}, {u:'විකල්පය අවසන්.', h:'</option>'},
        {u:'ලේබලය.', h:'<label>'}, {u:'ලේබලය අවසන්.', h:'</label>'},
        {u:'ශ්‍රව්‍ය.', h:'<audio>'}, {u:'ශ්‍රව්‍ය අවසන්.', h:'</audio>'},
        {u:'වීඩියෝ.', h:'<video>'}, {u:'වීඩියෝ අවසන්.', h:'</video>'},
        {u:'ශීර්ෂකය.', h:'<header>'}, {u:'ශීර්ෂකය අවසන්.', h:'</header>'},
        {u:'පාදකය.', h:'<footer>'}, {u:'පාදකය අවසන්.', h:'</footer>'},
        {u:'සංචාලනය.', h:'<nav>'}, {u:'සංචාලනය අවසන්.', h:'</nav>'},
        {u:'ලිපිය.', h:'<article>'}, {u:'ලිපිය අවසන්.', h:'</article>'},
        {u:'අංශය.', h:'<section>'}, {u:'අංශය අවසන්.', h:'</section>'},
        {u:'තද_අකුරු.', h:'<strong>'}, {u:'තද_අකුරු අවසන්.', h:'</strong>'},
        {u:'ඇල_අකුරු.', h:'<em>'}, {u:'ඇල_අකුරු අවසන්.', h:'</em>'},
        {u:'කේතය.', h:'<code>'}, {u:'කේතය අවසන්.', h:'</code>'},
        {u:'පේළි_බිඳුම.', h:'<br>'},
        {u:'තිරස්_ඉර.', h:'<hr>'}
    ];
    
    // සම්පූර්ණ පෙරනිමි ගුණාංග ලැයිස්තුව
    let defaultAttrs = [
        {u:'ලිපිනය=', h:'href='},
        {u:'මූලාශ්‍රය=', h:'src='},
        {u:'හැඩය=', h:'style='},
        {u:'පන්තිය=', h:'class='},
        {u:'අන්‍යතාව=', h:'id='},
        {u:'පළල=', h:'width='},
        {u:'උස=', h:'height='},
        {u:'විකල්ප_පෙළ=', h:'alt='},
        {u:'වර්ගය=', h:'type='},
        {u:'අගය=', h:'value='},
        {u:'රඳවනය=', h:'placeholder='},
        {u:'නම=', h:'name='},
        {u:'ක්‍රියාව=', h:'action='},
        {u:'ක්‍රමය=', h:'method='},
        {u:'ඉලක්කය=', h:'target='},
        {u:'සබැඳිය=', h:'rel='},
        {u:'භාෂාව=', h:'lang='},
        {u:'මාතෘකාව=', h:'title='},
        {u:'අක්‍රීය=', h:'disabled='},
        {u:'අනිවාර්ය=', h:'required='},
        {u:'තෝරාගත්=', h:'selected='},
        {u:'ලකුණුකළ=', h:'checked='},
        {u:'කියවීමටපමණක්=', h:'readonly='},
        {u:'උපරිම_දිග=', h:'maxlength='},
        {u:'අවම_දිග=', h:'minlength='},
        {u:'අවම=', h:'min='},
        {u:'උපරිම=', h:'max='},
        {u:'පියවර=', h:'step='},
        {u:'ස්වයංක්‍රීය_ප්‍රයත්නය=', h:'autocomplete='},
        {u:'ස්වයංක්‍රීය_යොමුව=', h:'autofocus='},
        {u:'පාලක=', h:'controls='},
        {u:'ස්වයංක්‍රීය_ධාවනය=', h:'autoplay='},
        {u:'සැඟවුණු=', h:'hidden='},
        {u:'බාගතකිරීම=', h:'download='}
    ];
    
    try {
        tags = JSON.parse(localStorage.getItem('proTags')) || defaultTags;
        attrs = JSON.parse(localStorage.getItem('proAttrs')) || defaultAttrs;
    } catch(e) {
        tags = defaultTags;
        attrs = defaultAttrs;
    }
}

function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

// 🔬 සුරක්ෂිත ටෝකනයිසර් ක්‍රමවේදය සහිත වර්ණ ගැන්වීමේ ශ්‍රිතය
function highlightHTMLSyntax(text) {
    let raw = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    let tokens = [];
    const addToken = (htmlContent) => {
        tokens.push(htmlContent);
        // අකුරු නොවන විශේෂ සංකේත භාවිතයෙන් Regex පැටලීම වළක්වා ඇත
        return `@@TOKEN_${tokens.length - 1}@@`;
    };
    
    // 1. මුලින්ම ස්ට්‍රින්ග්ස් (Strings) වෙන්කර ආරක්ෂා කරයි
    raw = raw.replace(/(["'])([\s\S]*?)\1/g, (match) => {
        return addToken(`<span style="color: #98C379; font-weight: 500;">${match}</span>`);
    });

    // 2. ඉංග්‍රීසි HTML ටැග් ඇතුලත වර්ණ ගැන්වීම
    raw = raw.replace(/(&lt;\/?)([a-zA-Z0-9]+)/g, (match, p1, p2) => {
        return p1 + addToken(`<span style="color: #E06C75;">${p2}</span>`);
    });

    // 3. ඉංග්‍රීසි ගුණාංග (Attributes)
    raw = raw.replace(/([a-zA-Z0-9-]+)=/g, (match, p1) => {
        return addToken(`<span style="color: #D19A66;">${p1}</span>`) + "=";
    });

    // 4. සිංහල අවසන් ටැග් (Closing Tags)
    raw = raw.replace(/([\u0D80-\u0DFFa-zA-Z0-9_]+\s+අවසන්\.)/g, (match) => {
        return addToken(`<span style="color: #E06C75; font-weight: bold;">${match}</span>`);
    });

    // 5. සිංහල ආරම්භක ටැග් (Opening Tags)
    raw = raw.replace(/([\u0D80-\u0DFFa-zA-Z0-9_]+)\./g, (match, p1) => {
        return addToken(`<span style="color: #61AFEF; font-weight: bold;">${p1}.</span>`);
    });

    // 6. සිංහල ගුණාංග (Attributes)
    raw = raw.replace(/([\u0D80-\u0DFF_a-zA-Z0-9]+)=/g, (match, p1) => {
        return addToken(`<span style="color: #D19A66;">${p1}</span>`) + "=";
    });

    // ආරක්ෂා කරගත් සියලුම වර්ණ ගැන්වූ කොටස් නැවත පිළිවෙලට ආදේශ කිරීම
    for (let i = 0; i < tokens.length; i++) {
        raw = raw.replace(`@@TOKEN_${i}@@`, tokens[i]);
    }

    return raw;
}

function updateLineNumbers(editorId, gutterId) {
    let code = document.getElementById(editorId).value;
    let lines = code.split('\n').length;
    let gutterArray = [];
    for (let i = 1; i <= lines; i++) { gutterArray.push(i); }
    document.getElementById(gutterId).textContent = gutterArray.join('\n');
}

function updateFromSinhala() {
    if(isSyncing) return;
    isSyncing = true;
    
    let sinCode = document.getElementById('editorSinhala').value;
    localStorage.setItem('savedEditorCode', sinCode);
    
    document.getElementById('highlightSinhala').innerHTML = highlightHTMLSyntax(sinCode);
    updateLineNumbers('editorSinhala', 'gutterSinhala');

    let htmlCode = convertToHTML(sinCode);
    document.getElementById('editorHtml').value = htmlCode;
    document.getElementById('highlightHtml').innerHTML = highlightHTMLSyntax(htmlCode);
    updateLineNumbers('editorHtml', 'gutterHtml');
    
    isSyncing = false;
}

function updateFromHtml() {
    if(isSyncing) return;
    isSyncing = true;
    
    let htmlCode = document.getElementById('editorHtml').value;
    
    document.getElementById('highlightHtml').innerHTML = highlightHTMLSyntax(htmlCode);
    updateLineNumbers('editorHtml', 'gutterHtml');

    let sinCode = convertToSinhala(htmlCode);
    document.getElementById('editorSinhala').value = sinCode;
    localStorage.setItem('savedEditorCode', sinCode);
    document.getElementById('highlightSinhala').innerHTML = highlightHTMLSyntax(sinCode);
    updateLineNumbers('editorSinhala', 'gutterSinhala');
    
    isSyncing = false;
}

function convertToHTML(code) {
    let tempCode = code;
    
    // 1. ගුණාංග (Attributes) පරිවර්තනය
    let sortedAttrs = [...attrs].sort((a, b) => b.u.length - a.u.length);
    sortedAttrs.forEach(item => {
        let re = new RegExp(escapeRegExp(item.u), 'g');
        tempCode = tempCode.replace(re, item.h);
    });
    
    // 2. ටැග් (Tags) පරිවර්තනය
    let sortedTags = [...tags].sort((a, b) => b.u.length - a.u.length);
    sortedTags.forEach(item => {
        let re = new RegExp(escapeRegExp(item.u), 'g');
        tempCode = tempCode.replace(re, item.h);
    });
    
    // 3. ව්‍යුහාත්මක නිවැරදි කිරීම (HTML tags වලට පිටින් ඇති attributes ඇතුලට දැමීම)
    // උදා: <div> class="box" -> <div class="box">
    tempCode = tempCode.replace(/(<[a-zA-Z0-9]+>)((\s+[a-zA-Z0-9\-]+=(?:"[^"]*"|'[^']*'))+)/g, (match, tag, attrsStr) => {
        return tag.slice(0, -1) + attrsStr + '>';
    });
    
    return tempCode;
}

function convertToSinhala(code) {
    let tempCode = code;
    
    // 1. HTML ගුණාංග ටැගයෙන් පිටතට ගැනීම (සිංහල පරිවර්තනය පහසු කිරීමට)
    // උදා: <div class="box"> -> <div> class="box"
    tempCode = tempCode.replace(/<([a-zA-Z0-9]+)(\s+[^>]+)>/g, (match, tagName, attrsStr) => {
        if (attrsStr.endsWith('/')) { // Self-closing tags සඳහා
            return `<${tagName}>` + attrsStr.slice(0, -1);
        }
        return `<${tagName}>${attrsStr}`;
    });
    
    // 2. ටැග් (Tags) පරිවර්තනය
    let sortedTags = [...tags].sort((a, b) => b.h.length - a.h.length);
    sortedTags.forEach(item => {
        let re = new RegExp(escapeRegExp(item.h), 'g');
        tempCode = tempCode.replace(re, item.u);
    });
    
    // 3. ගුණාංග (Attributes) පරිවර්තනය
    let sortedAttrs = [...attrs].sort((a, b) => b.h.length - a.h.length);
    sortedAttrs.forEach(item => {
        let re = new RegExp(escapeRegExp(item.h), 'g');
        tempCode = tempCode.replace(re, item.u);
    });
    
    return tempCode;
}

function runOutput() {
    let sinCode = document.getElementById('editorSinhala').value;
    let finalHtml = convertToHTML(sinCode); 
    localStorage.setItem('proRenderHTML', finalHtml);
    window.open('result.html', 'ResultTab');
}

function copyCode(type) {
    let code = type === 'sinhala' ? document.getElementById('editorSinhala').value : document.getElementById('editorHtml').value;
    navigator.clipboard.writeText(code).then(() => alert("කේතය සාර්ථකව කොපි කරගන්නා ලදී!"));
}

function downloadCode(type) {
    let code = type === 'sinhala' ? document.getElementById('editorSinhala').value : document.getElementById('editorHtml').value;
    let fileName = type === 'sinhala' ? 'sinhala_code.txt' : 'index.html';
    if(!code.trim()) { alert("බාගැනීමට කේතයක් ලියා නැත!"); return; }
    let blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }