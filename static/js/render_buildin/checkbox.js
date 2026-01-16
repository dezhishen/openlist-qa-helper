import {
    registerRenderer,
    renderChildPanelArray,
    removeSubAns,
    renderAccordionQuestions,
} from "../render.js";
import { state } from "../state.js";
import { updateAccordionSubmitBtn } from "../app.js";
registerRenderer('checkbox', renderCheckboxInput);
function renderCheckboxInput(q, wrap) {
    wrap.style.maxHeight = '400px';
    wrap.style.overflowY = 'auto';
    let userans = state.userAnswers[q._qid];
    if (!userans) userans = state.userAnswers[q._qid] = { value: null };
    const customLabel = q.customLabel || '其他';
    const showCustom = q.custom === true;

    // 选项部分
    (q.items || []).forEach((opt, i) => {
        let chkWrap = document.createElement('div');
        chkWrap.style.margin = '10px 0';
        chkWrap.className = 'option-item';
        let ck = document.createElement('input');
        ck.type = 'checkbox';
        ck.name = 'check-' + q._qid + "-" + i;
        let checked = userans.value && Array.isArray(userans.value) && userans.value.indexOf(i) >= 0;
        ck.checked = checked;
        ck.onclick = (event) => {
            if (!userans.value) userans.value = [];
            let idx = userans.value.indexOf(i);
            if (ck.checked && idx < 0) userans.value.push(i);
            if (!ck.checked && idx >= 0) userans.value.splice(idx, 1);
            updateAccordionSubmitBtn();
            // 不自动折叠
            event.stopPropagation();
        };
        chkWrap.onclick = () => ck.click();
        chkWrap.appendChild(ck);
        let label = document.createElement('span');
        label.textContent = " " + opt.title + "  ";
        chkWrap.appendChild(label);
        if (opt.desc) {
            let d = document.createElement('span');
            d.style.color = '#b6b';
            d.textContent = opt.desc;
            chkWrap.appendChild(d);
        }
        let subContainer = document.createElement('div');
        subContainer.className = 'accordion-subchild';
        if (checked && opt.items && opt.items.length > 0) {
            renderChildPanelArray(opt.items, subContainer, 1);
        }
        chkWrap.appendChild(subContainer);
        wrap.appendChild(chkWrap);
    });

    // custom
    if (showCustom) {
        let cwrap = document.createElement('div');
        cwrap.style.margin = '10px 0';
        cwrap.className = 'option-item';
        let cbox = document.createElement('input');
        cbox.type = 'checkbox';
        cbox.name = 'check-' + q._qid + '-custom';
        let checked = !!userans.customChecked;
        cbox.checked = checked;
        cbox.onclick = (event) => {
            userans.customChecked = cbox.checked;
            if (!cbox.checked) userans.customValue = '';
            updateAccordionSubmitBtn();
            // 不自动折叠
            event.stopPropagation();
        };
        cwrap.onclick = () => cbox.click();
        cwrap.appendChild(cbox);
        let lbl = document.createElement('span');
        lbl.textContent = " " + customLabel + " ";
        cwrap.appendChild(lbl);
        if (checked) {
            let cin = document.createElement('input');
            cin.type = 'text';
            cin.className = 'input-field';
            cin.placeholder = '请输入自定义内容';
            cin.value = userans.customValue || '';
            let debounceTimer = null;
            cin.oninput = () => {
                userans.customValue = cin.value;
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updateAccordionSubmitBtn();
                }, 300);
            };
            cin.onblur = () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                updateAccordionSubmitBtn();
            };
            cin.onclick = (event) => event.stopPropagation();
            cwrap.appendChild(cin);
        }
        wrap.appendChild(cwrap);
    }

    // 加“完成本题”按钮
    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'btn-checkbox-done';
    doneBtn.textContent = '完成本题';
    doneBtn.style = 'margin:12px auto 0;display:block;';
    doneBtn.onclick = () => {
        // 按钮只自动折叠本面板，重新渲染
        renderAccordionQuestions(state.questionData);
    };
    wrap.appendChild(doneBtn);
}