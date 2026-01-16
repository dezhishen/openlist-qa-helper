import { state } from "./state.js";
import { isBranchSelected } from "./render.js";

/**
 * 获取问题的答案HTML字符串
 * @param {Object} q 问题对象
 * @param {Object} ua 用户答案
 * @returns {string} 答案HTML
 */
function getAnswerHtml(q, ua) {
    const type = q.type || 'radio';
    if (type === 'radio') {
        if (ua?.value?.type === 'option') {
            const opt = q.items[ua.value.index];
            return `<div class='path-value'>${opt ? opt.title : ''}</div>`;
        }
        if (ua?.value?.type === 'custom') {
            return `<div class='path-value'>${q.customLabel || '其他'}: ${ua.customValue || ''}</div>`;
        }
        return '';
    }
    if (type === 'checkbox') {
        const arr = [];
        if (ua && Array.isArray(ua.value) && q.items) {
            ua.value.forEach(idx => {
                const opt = q.items[idx];
                if (opt) arr.push(opt.title);
            });
        }
        if (ua?.customChecked) {
            arr.push(`${q.customLabel || '其他'}: ${ua.customValue || ''}`);
        }
        return `<div class='path-value'>${arr.join(', ')}</div>`;
    }
    if (type === 'input') {
        return `<div class='path-value'>${ua?.value || ''}</div>`;
    }
    return '';
}

/**
 * 递归渲染子项
 * @param {Object} q 问题对象
 * @param {HTMLElement} parent 父元素
 * @param {number} level 层级
 * @param {Object} ua 用户答案
 */
function renderSubItems(q, parent, level, ua) {
    const type = q.type || 'radio';
    if (type === 'radio' && ua?.value?.type === 'option') {
        const opt = q.items[ua.value.index];
        if (opt?.items) {
            opt.items.forEach(subq => renderAccordionResult(subq, parent, level + 1));
        }
    } else if (type === 'checkbox' && ua && Array.isArray(ua.value)) {
        ua.value.forEach(idx => {
            const opt = q.items[idx];
            if (opt?.items) {
                opt.items.forEach(subq => renderAccordionResult(subq, parent, level + 1));
            }
        });
    }
    // 插件型子题递归
    if (Array.isArray(q.items)) {
        q.items.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
                renderAccordionResult(item, parent, level + 1);
            }
        });
    }
}

/** 展示最终结果（支持插件化题型，树形递归缩进） */
export function renderAccordionResult(q, parent, level = 0) {
    if (!isBranchSelected(q)) return;

    const ua = state.userAnswers[q._qid];
    const itemContainer = document.createElement('div');
    itemContainer.className = 'path-item';
    itemContainer.style.marginLeft = `${level * 16}px`;

    // 构建标题和描述（仅顶级问题显示）
    if (level === 0) {
        itemContainer.innerHTML = `<div class='path-title'>${q.title}</div>`;
        if (q.desc) {
            itemContainer.innerHTML += `<div class='path-desc'>${q.desc}</div>`;
        }
    }

    // 处理radio的特殊情况（可能没有答案）
    const type = q.type || 'radio';
    if (type === 'radio') {
        if (!ua || !ua.value) return; // 无答案不显示

        const answerHtml = getAnswerHtml(q, ua);
        itemContainer.innerHTML += answerHtml;
        parent.appendChild(itemContainer);

        // 递归子项
        renderSubItems(q, parent, level, ua);
        return;
    }

    // 其他类型：构建答案并添加DOM
    const answerHtml = getAnswerHtml(q, ua);
    itemContainer.innerHTML += answerHtml;
    parent.appendChild(itemContainer);

    // 递归子项
    renderSubItems(q, parent, level, ua);
}

/**
 * 获取问题的答案文本字符串（用于复制）
 * @param {Object} q 问题对象
 * @param {Object} ua 用户答案
 * @returns {string} 答案文本
 */
function getAnswerText(q, ua) {
    const type = q.type || 'radio';
    if (type === 'radio') {
        if (ua?.value?.type === 'option') {
            const opt = q.items[ua.value.index];
            return opt ? opt.title : '';
        }
        if (ua?.value?.type === 'custom') {
            return `${q.customLabel || '其他'}: ${ua.customValue || ''}`;
        }
        return '';
    }
    if (type === 'checkbox') {
        const arr = [];
        if (ua && Array.isArray(ua.value) && q.items) {
            ua.value.forEach(idx => {
                const opt = q.items[idx];
                if (opt) arr.push(opt.title);
            });
        }
        if (ua?.customChecked) {
            arr.push(`${q.customLabel || '其他'}: ${ua.customValue || ''}`);
        }
        return arr.join(', ');
    }
    if (type === 'input') {
        return ua?.value || '';
    }
    return '';
}

/**
 * 递归遍历问题生成文本（用于复制）
 * @param {Object} q 问题对象
 * @param {number} level 层级
 * @param {string} resultText 结果文本引用
 */
function walkQuestion(q, level, resultText) {
    if (!isBranchSelected(q)) return;

    const pad = '  '.repeat(level);
    const ua = state.userAnswers[q._qid];
    const type = q.type || 'radio';

    // 顶级问题显示标题，子节点只显示答案
    if (level === 0) {
        resultText.push(`${pad}${q.title}: ${getAnswerText(q, ua)}\n`);
    } else {
        var answerText = getAnswerText(q, ua)
        if (answerText == "") return
        resultText.push(`${pad}${answerText}\n`);
    }

    // 递归子项
    if (type === 'radio' && ua?.value?.type === 'option') {
        const opt = q.items[ua.value.index];
        if (opt?.items) {
            opt.items.forEach(subq => walkQuestion(subq, level + 1, resultText));
        }
    } else if (type === 'checkbox' && ua && Array.isArray(ua.value)) {
        ua.value.forEach(idx => {
            const opt = q.items[idx];
            if (opt?.items) {
                opt.items.forEach(subq => walkQuestion(subq, level + 1, resultText));
            }
        });
    }
    // 插件型子题递归
    if (Array.isArray(q.items)) {
        q.items.forEach(item => {
            if (item && typeof item === 'object' && item.type) {
                walkQuestion(item, level + 1, resultText);
            }
        });
    }
}

/** 一键复制结果，包含插件型子题递归（文本缩进） */
export function copyResult() {
    const resultText = [];
    state.questionData.forEach(q => walkQuestion(q, 0, resultText));

    // 使用兼容的复制方法
    const textarea = document.createElement('textarea');
    textarea.value = resultText.join('');
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    // 更新按钮状态
    const btn = document.querySelector('.btn-copy');
    const originalText = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
        btn.classList.remove('copied');
        btn.textContent = originalText;
    }, 1400);
}