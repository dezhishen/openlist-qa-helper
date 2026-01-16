import { state } from "./state.js";
import { isBranchSelected } from "./render.js";

/**
 * 递归判断问题是否已填写
 */
export function isQuestionAnswered(q) {
    const ua = state.userAnswers[q._qid];
    if ((q.type || 'radio') === 'radio') {
        if (!ua || !ua.value) return (!q.required || q.required === false);
        if (ua.value.type === 'option') {
            let opt = q.items[ua.value.index];
            if (opt && opt.items)
                for (let sub of opt.items)
                    if (!isQuestionAnswered(sub)) return false;
            return true;
        }
        if (ua.value.type === 'custom') return (!q.required || q.required === false) || (ua.customValue && ua.customValue.trim());
        return false;
    }
    if ((q.type || 'radio') === 'checkbox') {
        if ((!ua || !Array.isArray(ua.value) || ua.value.length === 0) && !ua?.customChecked)
            return (!q.required || q.required === false);
        if (ua && Array.isArray(ua.value)) {
            for (let idx of ua.value) {
                let opt = q.items[idx];
                if (opt && opt.items)
                    for (let sub of opt.items)
                        if (!isQuestionAnswered(sub)) return false;
            }
        }
        // custom: 被勾时必填（仅当问题为必填时）
        if (ua?.customChecked && q.required && !(ua.customValue && ua.customValue.trim())) return false;
        return true;
    }
    if ((q.type || 'radio') === 'input')
        return (!q.required || q.required === false) || (ua && ua.value && ua.value.toString().trim());
    return true;
}

export function checkAccordionAllFilled() {
    let ok = true;
    function walk(list) {
        if (!Array.isArray(list)) return;
        for (let q of list) {
            if (!isBranchSelected(q)) continue; // 未被选中的分支不校验
            if (!isQuestionAnswered(q)) ok = false;
            if (Array.isArray(q.items)) walk(q.items);
        }
    }
    walk(state.questionData);
    return ok;
}