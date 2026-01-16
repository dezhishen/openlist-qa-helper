import { state } from "./state.js";
import { updateAccordionSubmitBtn } from "./app.js";
import { isQuestionAnswered } from "./validate.js";
// ---- 题型渲染注册机制 ----
const RENDERER_MAP = {};

/**
 * 外部注册新的渲染器
 * @param {string} type 题型
 * @param {function} renderer 渲染函数
 */
export function registerRenderer(type, rendererFn) {
    RENDERER_MAP[type] = rendererFn;
}

/**
 * 按类型派发渲染
 */
export function renderInputForm(q, wrap) {
    let type = (q.type || 'radio');
    let renderer = RENDERER_MAP[type];
    if (renderer) renderer(q, wrap);
    else {
        throw new Error(`[InputRender] 未注册的类型 "${type}" 渲染器，请调用registerRenderer('${type}', fn)进行注册！`);
    }
}

// --- 概览显示字符串
export function buildPanelOverview(q) {
    const ua = state.userAnswers[q._qid];
    if (!ua) return '';
    if ((q.type || 'radio') === 'radio') {
        if (ua.value?.type === 'option') {
            let opt = q.items[ua.value.index];
            return opt ? opt.title : '';
        }
        if (ua.value?.type === 'custom') {
            return `${q.customLabel || '其他'}: ${ua.customValue || ''}`;
        }
    }
    if ((q.type || 'radio') === 'checkbox') {
        let arr = [];
        if (ua && Array.isArray(ua.value) && q.items) ua.value.forEach(idx => {
            let opt = q.items[idx];
            if (opt) arr.push(opt.title);
        });
        if (ua && ua.customChecked) arr.push((q.customLabel || '其他') + ': ' + (ua.customValue || ''));
        return arr.join(', ');
    }
    if ((q.type || 'radio') === 'input') {
        return ua.value || '';
    }
    return '';
}

/** 构造问卷面板，包括自动收起/实时概览 */
export function buildAccordionPanel(q, level = 0) {
    const wrap = document.createElement('div');
    wrap.className = 'accordion' + (level === 0 ? '' : ' accordion-child');
    wrap.id = 'accordion-' + q._qid;
    // 缩进风格
    wrap.style.marginLeft = `${level * 32}px`; 

    const header = document.createElement('div');
    header.className = 'accordion-header';
    
    // 创建标题容器
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'display: flex; align-items: center; flex: 1; position: relative; line-height: 1.2;';
    
    // 标题文本
    const titleText = document.createElement('span');
    titleText.innerHTML = `<span class="${(q.required !== false) ? 'required-badge' : 'optional-badge'}" style="margin-right:8px">${q.required !== false ? '必填' : '可选'}</span>` + q.title;
    titleContainer.appendChild(titleText);
    
    // 添加tips icon
    if (q.tips) {
        const tipsIcon = document.createElement('span');
        tipsIcon.className = 'tips-icon';
        tipsIcon.textContent = '?';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tips-tooltip';
        tooltip.innerHTML = q.tips;
        
        tipsIcon.appendChild(tooltip);
        tipsIcon.onmouseenter = () => tooltip.style.display = 'block';
        tipsIcon.onmouseleave = () => tooltip.style.display = 'none';
        
        titleContainer.appendChild(tipsIcon);
    }
    
    // 创建箭头容器
    const arrowContainer = document.createElement('div');
    arrowContainer.innerHTML = '<span class="accordion-arrow">▶</span>';
    
    // 概览区（答案实时显示）
    let overviewEl = document.createElement('div');
    overviewEl.className = 'panel-overview';
    overviewEl.style = 'font-size:14px;color:#667eea;margin-top:5px;word-break:break-all;font-weight:400;';
    let overview = buildPanelOverview(q);
    if (overview) {
        overviewEl.textContent = '已选/已填：' + overview;
    } else {
        overviewEl.textContent = '';
    }
    
    // 组装 header
    header.appendChild(titleContainer);
    header.appendChild(arrowContainer);
    header.appendChild(overviewEl);

    const arrowEl = header.querySelector('.accordion-arrow');
    function syncArrow() {
        if (arrowEl) arrowEl.textContent = wrap.classList.contains('open') ? '▼' : '▶';
    }

    // 自动收起/展开逻辑
    function setAccordionState(initial = false) {
        // 父节点被选中时，子节点初始自动展开
        if (initial && level > 0 && isBranchSelected(q)) {
            wrap.classList.add('open');
            header.classList.add('open');
            syncArrow();
            return;
        }
        if (isQuestionAnswered(q)) {
            wrap.classList.remove('open');
            header.classList.remove('open');
        } else if (level === 0 && !document.querySelector('.accordion.open')) {
            wrap.classList.add('open');
            header.classList.add('open');
        }
        syncArrow();
    }
    setAccordionState(true);
    syncArrow();

    // 用户手动开关
    header.onclick = () => {
        wrap.classList.toggle('open');
        if (wrap.classList.contains('open')) header.classList.add('open');
        else header.classList.remove('open');
        syncArrow();
    };

    const body = document.createElement('div');
    body.className = 'accordion-body';
    if (q.desc) {
        const desc = document.createElement('div');
        desc.style.cssText = "color:#788;width:100%;margin-bottom:10px;font-size:15px;";
        desc.textContent = q.desc;
        body.appendChild(desc);
    }
    let controlDiv = document.createElement('div');
    body.appendChild(controlDiv);
    renderInputForm(q, controlDiv);

    wrap.appendChild(header);
    wrap.appendChild(body);

    // 每次渲染后同步概览和开关
    setTimeout(() => {
        let ov = buildPanelOverview(q);
        let ovEl = header.querySelector('.panel-overview');
        if (ovEl) ovEl.textContent = ov ? ('已选/已填：' + ov) : '';
        setAccordionState();
        syncArrow();
    }, 0);

    return wrap;
}

/** 递归生成问卷区域（保留树结构，支持插件化子节点） */
export function renderAccordionQuestions(list, container, level = 0) {
    if (!container) container = document.getElementById('questionsContainer');
    if (level === 0) container.innerHTML = '';
    list.forEach(q => {
        if (!isBranchSelected(q)) return; // 子题仅在父选中时展示
        const panel = buildAccordionPanel(q, level);
        container.appendChild(panel);
        // 仅对子题型递归（插件型题型）
        if (Array.isArray(q.items)) {
            q.items.forEach(item => {
                if (item && typeof item === 'object' && item.type) {
                    renderAccordionQuestions([item], container, level + 1);
                }
            });
        }
    });
    if (level === 0) {
        document.getElementById('resultArea').classList.add('hidden');
        document.getElementById('questionArea').classList.remove('hidden');
        updateAccordionSubmitBtn();
    }
}

/** 工具：递归节点扁平化 */
export function flattenQuestions(list, prefix, parentObj) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
        let q = list[i];
        let id = (prefix ? prefix + '.' : '') + i;
        q._qid = id;
        q._idx = i; // 记录在父items中的索引，便于判断选中状态
        q._parent = parentObj || null;
        if (Array.isArray(q.items)) flattenQuestions(q.items, id, q);
    }
}

// 判断当前题目所在分支是否被父级选中（用于递归渲染控制）
export function isBranchSelected(q) {
    if (!q?._parent) return true;
    const parent = q._parent;
    const parentType = parent.type || 'radio';
    const parentAns = state.userAnswers[parent._qid];
    const idx = q._idx ?? (parent.items || []).indexOf(q);

    let selected = true;
    if (idx < 0) selected = false;
    else if (parentType === 'radio') selected = parentAns?.value?.type === 'option' && parentAns.value.index === idx;
    else if (parentType === 'checkbox') selected = Array.isArray(parentAns?.value) && parentAns.value.includes(idx);

    if (!selected) return false;
    return isBranchSelected(parent);
}

export function renderChildPanelArray(sublist, container, level) {
    sublist.forEach(sub => {
        container.appendChild(buildAccordionPanel(sub, level));
    });
}

// 在radio/checkbox下用于清除未被选分支数据
export function removeSubAns(subq) {
    if (state.userAnswers[subq._qid]) delete state.userAnswers[subq._qid];
    if (Array.isArray(subq.items)) subq.items.forEach(removeSubAns);
}
