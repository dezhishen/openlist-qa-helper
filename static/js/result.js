import { state } from "./state.js";
import { isBranchSelected } from "./render.js";

/** 展示最终结果（支持插件化题型，树形递归缩进） */
export function renderAccordionResult(q, par, level = 0) {
    if (!isBranchSelected(q)) return;
    let ua = state.userAnswers[q._qid];
    let cont = document.createElement('div');
    cont.className = 'path-item';
    cont.style.marginLeft = (level * 16) + 'px';
    cont.innerHTML = `<div class='path-title'>${q.title}</div>`;
    if (q.desc) cont.innerHTML += `<div class='path-desc'>${q.desc}</div>`;
    let ansHtml = "";
    if ((q.type || 'radio') === 'radio') {
        if (ua && ua.value?.type === 'option') {
            let opt = q.items[ua.value.index];
            ansHtml += `<div class='path-value'>${opt ? opt.title : ''}</div>`;
            // 递归option的子项
            if (opt && Array.isArray(opt.items)) opt.items.forEach(subq => renderAccordionResult(subq, par, level + 1));
        }
        if (ua && ua.value?.type === 'custom') {
            ansHtml += `<div class='path-value'>${q.customLabel || '其他'}: ${ua.customValue || ''}</div>`;
        }
    } else if ((q.type || 'radio') === 'checkbox') {
        let arr = [];
        if (ua && Array.isArray(ua.value) && q.items)
            ua.value.forEach(idx => {
                let opt = q.items[idx];
                if (opt) arr.push(opt.title);
            });
        if (ua && ua.customChecked) arr.push((q.customLabel || '其他') + ': ' + (ua.customValue || ''));
        ansHtml += `<div class='path-value'>${arr.join(', ')}</div>`;
        if (ua && Array.isArray(ua.value) && q.items)
            ua.value.forEach(idx => {
                let opt = q.items[idx];
                if (opt && Array.isArray(opt.items)) opt.items.forEach(subq => renderAccordionResult(subq, par, level + 1));
            });
    } else if ((q.type || 'radio') === 'input') {
        ansHtml += `<div class='path-value'>${ua && ua.value ? ua.value : ''}</div>`;
        // 插件型子题递归
        if (Array.isArray(q.items)) {
            q.items.forEach(item => {
                if (item && typeof item === 'object' && item.type) {
                    renderAccordionResult(item, par, level + 1);
                }
            });
        }
    } else {
        // 其它类型自定义递归
        if (Array.isArray(q.items)) {
            q.items.forEach(item => {
                if (item && typeof item === 'object' && item.type) {
                    renderAccordionResult(item, par, level + 1);
                }
            });
        }
    }
    cont.innerHTML += ansHtml;
    par.appendChild(cont);
}

/** 一键复制结果，包含插件型子题递归（文本缩进） */
export function copyResult() {
    let resultText = '';
    function walk(q, level) {
        let pad = '  '.repeat(level);
        let ua = state.userAnswers[q._qid];
        resultText += `${pad}${q.title}: `;
        if ((q.type || 'radio') === 'radio') {
            if (ua && ua.value?.type === 'option') {
                let opt = q.items[ua.value.index];
                resultText += (opt ? opt.title : '') + '\n';
            }
            else if (ua && ua.value?.type === 'custom') {
                resultText += (q.customLabel || '其他') + ': ' + (ua.customValue || '') + '\n';
            }
            // 插件型子题
            if (Array.isArray(q.items)) {
                q.items.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        walk(item, level + 1);
                    }
                });
            }
        } else if ((q.type || 'radio') === 'checkbox') {
            let arr = [];
            if (ua && Array.isArray(ua.value) && q.items)
                ua.value.forEach(idx => {
                    let opt = q.items[idx];
                    if (opt) arr.push(opt.title);
                });
            if (ua && ua.customChecked)
                arr.push((q.customLabel || '其他') + ': ' + (ua.customValue || ''));
            resultText += arr.join(', ') + '\n';
            // 递归选择的选项的子题
            if (ua && Array.isArray(ua.value) && q.items)
                ua.value.forEach(idx => {
                    let opt = q.items[idx];
                    if (opt && Array.isArray(opt.items)) opt.items.forEach(subq => walk(subq, level + 1));
                });
            // 递归插件型子题
            if (Array.isArray(q.items)) {
                q.items.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        walk(item, level + 1);
                    }
                });
            }
        } else if ((q.type || 'radio') === 'input') {
            resultText += (ua && ua.value ? ua.value : '') + '\n';
            // 插件型子题
            if (Array.isArray(q.items)) {
                q.items.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        walk(item, level + 1);
                    }
                });
            }
        } else {
            // 其它类型的插件型子题
            if (Array.isArray(q.items)) {
                q.items.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        walk(item, level + 1);
                    }
                });
            }
        }
    }
    state.questionData.forEach(q => walk(q, 0));
    // 使用兼容的复制方法
    const textarea = document.createElement('textarea');
    textarea.value = resultText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    // 更新按钮状态
    const btn = document.querySelector('.btn-copy');
    const origin = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = origin; }, 1400);
}