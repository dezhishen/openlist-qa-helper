import {
    registerRenderer,
    renderChildPanelArray,
    removeSubAns,
    renderAccordionQuestions,
} from "../render.js";
import { state } from "../state.js";
import { updateAccordionSubmitBtn } from "../app.js";
// --- 输入题 ----

// --- 输入题（防抖优化）----
function renderTextInput(q, wrap) {
    let userans = state.userAnswers[q._qid];
    if (!userans) userans = state.userAnswers[q._qid] = { value: null };

    // 创建输入容器
    const inputContainer = document.createElement('div');
    inputContainer.style.marginBottom = '10px';

    let input = q.inputType === "textarea" ? document.createElement('textarea') : document.createElement('input');
    input.className = q.inputType === "textarea" ? 'textarea-field' : 'input-field';
    if (q.placeholder) input.placeholder = q.placeholder;
    input.value = userans.value || '';

    let debounceTimer = null;
    let isQuickInputClick = false; // 标记是否是快捷输入点击

    input.oninput = () => {
        userans.value = input.value;
        // 防抖：用户停止输入 500ms 后才触发校验
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateAccordionSubmitBtn();
            // 可选：输入完成后自动收起面板
            // renderAccordionQuestions(state. questionData);
        }, 500);
    };

    // 失焦时立即触发校验和可能的面板收起
    input.onblur = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        updateAccordionSubmitBtn();

        // 只有在不是快捷输入点击时才折叠面板
        if (!isQuickInputClick) {
            // 输入完成后重新渲染，触发面板自动收起
            renderAccordionQuestions(state.questionData);
        }
        isQuickInputClick = false; // 重置标记
    };

    inputContainer.appendChild(input);

    // 添加快捷输入按钮
    if (q.quickInputs && q.quickInputs.length > 0) {
        const quickButtonsContainer = document.createElement('div');
        quickButtonsContainer.style.display = 'flex';
        quickButtonsContainer.style.flexWrap = 'wrap';
        quickButtonsContainer.style.gap = '5px';
        quickButtonsContainer.style.marginTop = '8px';

        // 重新排序：将清空按钮放在前面
        const sortedQuickInputs = [...q.quickInputs].sort((a, b) => {
            if (a.label === '清空') return -1;
            if (b.label === '清空') return 1;
            return 0;
        });

        // 创建快捷按钮
        sortedQuickInputs.forEach(btnConfig => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = btnConfig.label;
            btn.style.cssText = `
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f8f9fa;
                color: #666;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            btn.onmouseover = () => {
                btn.style.background = '#e9ecef';
                btn.style.borderColor = '#adb5bd';
            };
            btn.onmouseout = () => {
                btn.style.background = '#f8f9fa';
                btn.style.borderColor = '#ddd';
            };
            btn.onclick = (e) => {
                e.preventDefault();
                isQuickInputClick = true; // 设置标记

                if (btnConfig.label === '清空') {
                    // 清空按钮：完全清空内容
                    input.value = btnConfig.value;
                } else {
                    // 检查是否已经包含该内容，避免重复添加
                    const currentValue = input.value;
                    const contentToAdd = btnConfig.value;

                    // 如果内容已经存在，不再添加
                    if (currentValue.includes(contentToAdd)) {
                        // 可以添加一些视觉反馈，比如按钮闪烁
                        btn.style.background = '#ffc107';
                        setTimeout(() => {
                            btn.style.background = '#f8f9fa';
                        }, 200);
                        return;
                    }

                    // 其他按钮：在现有内容后添加
                    if (currentValue && !currentValue.endsWith('\n') && !currentValue.endsWith(', ')) {
                        input.value += ', '; // 如果不是空内容且不以换行符或", "结尾，添加", "
                    }
                    input.value += contentToAdd;
                }

                input.focus();
                // 触发输入事件以更新状态
                input.oninput();
            };
            quickButtonsContainer.appendChild(btn);
        });

        inputContainer.appendChild(quickButtonsContainer);
    }

    wrap.appendChild(inputContainer);
}

registerRenderer('input', renderTextInput);
