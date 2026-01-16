import {
    registerRenderer,
    renderChildPanelArray,
    removeSubAns,
    renderAccordionQuestions,
} from "../render.js";
import { state } from "../state.js";
import { updateAccordionSubmitBtn } from "../app.js";


function renderRadioInput(q, wrap) {
    wrap.style.maxHeight = '400px';
    wrap.style.overflowY = 'auto';
    let userans = state.userAnswers[q._qid];
    if (!userans) userans = state.userAnswers[q._qid] = { value: null };
    const customLabel = q.customLabel || '其他';
    const showCustom = q.custom === true;

    (q.items || []).forEach((opt, i) => {
        let radioWrap = document.createElement('div');
        radioWrap.style.margin = '10px 0';
        radioWrap.className = 'option-item';
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'radio-' + q._qid;
        radio.value = i;
        radio.checked = userans.value && userans.value.type === 'option' && userans.value.index == i;
        radio.onclick = (event) => {
            userans.value = { type: 'option', index: i, data: opt };
            userans.customValue = '';
            (q.items || []).forEach((sub, k) => { if (k !== i && sub.items) sub.items.forEach(removeSubAns); });
            updateAccordionSubmitBtn();
            renderAccordionQuestions(state.questionData);
            event.stopPropagation();
        };
        radioWrap.onclick = () => radio.click();
        radioWrap.appendChild(radio);
        let label = document.createElement('span');
        label.textContent = " " + opt.title + "  ";
        radioWrap.appendChild(label);
        if (opt.desc) {
            let d = document.createElement('span');
            d.style.color = '#b6b';
            d.textContent = opt.desc;
            radioWrap.appendChild(d);
        }
        let subContainer = document.createElement('div');
        subContainer.className = 'accordion-subchild';
        if (radio.checked && opt.items && opt.items.length > 0) {
            renderChildPanelArray(opt.items, subContainer, 1);
        }
        radioWrap.appendChild(subContainer);
        wrap.appendChild(radioWrap);
    });

    // 支持custom
    if (showCustom) {
        let radioWrap = document.createElement('div');
        radioWrap.style.margin = '10px 0';
        radioWrap.className = 'option-item';
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'radio-' + q._qid;
        radio.value = 'custom';
        const checked = userans.value && userans.value.type === 'custom';
        radio.checked = checked;
        radio.onclick = (event) => {
            userans.value = { type: 'custom' };
            updateAccordionSubmitBtn();
            renderAccordionQuestions(state.questionData);
            event.stopPropagation();
        };
        radioWrap.onclick = () => radio.click();
        radioWrap.appendChild(radio);
        let label = document.createElement('span');
        label.textContent = " " + customLabel + " ";
        radioWrap.appendChild(label);
        if (checked) {
            let input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-field';
            input.placeholder = '请输入自定义内容';
            input.value = userans.customValue || '';

            let debounceTimer = null;
            input.oninput = () => {
                userans.customValue = input.value;
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updateAccordionSubmitBtn();
                }, 300);
            };
            input.onblur = () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                updateAccordionSubmitBtn();
                renderAccordionQuestions(state.questionData); // 自动收起
            };
            input.onclick = (event) => event.stopPropagation();

            radioWrap.appendChild(input);
        }
        wrap.appendChild(radioWrap);
    }
}
registerRenderer('radio', renderRadioInput);