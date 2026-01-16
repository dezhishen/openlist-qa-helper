import { state, resetState } from "./state.js";
import { flattenQuestions, renderAccordionQuestions } from "./render.js";
import { renderAccordionResult, copyResult } from "./result.js";
import { checkAccordionAllFilled } from "./validate.js";
import "./render_buildin/index.js";

// loading
function showLoading(show = true) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        if (show) loadingDiv.classList.remove('hidden');
        else loadingDiv.classList.add('hidden');
    }
}

async function loadYAML() {
    showLoading(true);
    try {
        const response = await fetch('./data/questions.yaml');
        const yamlText = await response.text();
        state.questionData = jsyaml.load(yamlText);
        resetState();
        flattenQuestions(state.questionData, '', null);
        renderAccordionQuestions(state.questionData);
        showLoading(false);
        updateAccordionSubmitBtn();
    } catch (e) {
        alert('加载问题数据失败，请检查 questions.yaml 文件');
        showLoading(false);
    }
}

export function updateAccordionSubmitBtn() {
    let btn = document.getElementById('accordion-submit-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'accordion-submit-btn';
        btn.className = 'btn-next';
        btn.type = 'button';
        btn.style = 'width:100%;margin:30px auto 0;display:block;font-size:18px;';
        btn.innerText = '查看我的结果';
        btn.onclick = () => {
            if (checkAccordionAllFilled()) showAccordionResult();
            else alert('请完成所有必填项！');
        };
        document.getElementById('questionsContainer').appendChild(btn);
    }
    btn.disabled = !checkAccordionAllFilled();
}

// 最终结果区域
function showAccordionResult() {
    document.getElementById('resultArea').classList.remove('hidden');
    document.getElementById('questionArea').classList.add('hidden');
    const resultPath = document.getElementById('resultPath');
    resultPath.innerHTML = '';
    for (const q of state.questionData) {
        renderAccordionResult(q, resultPath, 0);
    }
}

window.copyResult = copyResult;
window.restart = function () {
    resetState();
    renderAccordionQuestions(state.questionData);
    updateAccordionSubmitBtn();
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('questionArea').classList.remove('hidden');
};
window.goBack = function () {
    window.restart();
};

window.onload = function () {
    showLoading(true);
    loadYAML();
};