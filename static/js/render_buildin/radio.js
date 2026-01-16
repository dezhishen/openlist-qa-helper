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
    const totalOptions = (q.items || []).length + (showCustom ? 1 : 0);
    const hasSearch = totalOptions > 6;

    // 添加搜索框
    let searchInput = null;
    if (hasSearch) {
        searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '搜索选项...';
        searchInput.className = 'input-field';
        searchInput.style.marginBottom = '10px';
        searchInput.style.width = '100%';
        searchInput.oninput = () => filterOptions();
        wrap.appendChild(searchInput);
    }

    // 过滤选项函数
    function filterOptions() {
        if (!hasSearch) return;
        const searchTerm = searchInput.value.toLowerCase();
        const optionItems = wrap.querySelectorAll('.option-item');
        optionItems.forEach(item => {
            const text = item.dataset.searchText || '';
            const shouldShow = text.includes(searchTerm);
            item.style.display = shouldShow ? 'block' : 'none';
        });
    }

    (q.items || []).forEach((opt, i) => {
        let radioWrap = document.createElement('div');
        radioWrap.style.margin = '10px 0';
        radioWrap.className = 'option-item';
        radioWrap.dataset.searchText = (opt.title + (opt.desc || '')).toLowerCase();
        let radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'radio-' + q._qid;
        radio.value = i;
        let isChecked = userans.value && userans.value.type === 'option' && userans.value.index == i;
        // 如果用户还没有选择且选项设置为默认选中，则选中
        if (!userans.value && opt.checked === true) {
            isChecked = true;
            userans.value = { type: 'option', index: i, data: opt };
        }
        radio.checked = isChecked;
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
        radioWrap.dataset.searchText = customLabel.toLowerCase();
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