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
    let input = q.inputType === "textarea" ? document.createElement('textarea') : document.createElement('input');
    input.className = q.inputType === "textarea" ? 'textarea-field' : 'input-field';
    if (q.placeholder) input.placeholder = q.placeholder;
    input.value = userans.value || '';

    let debounceTimer = null;
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
        // 输入完成后重新渲染，触发面板自动收起
        renderAccordionQuestions(state.questionData);
    };

    wrap.appendChild(input);
}

registerRenderer('input', renderTextInput);
