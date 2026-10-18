/**
 * Helper to prepare source code for Judge0 execution.
 *
 * Supports both standard LeetCode function style (where solutions return values)
 * and competitive programming I/O (where solutions read stdin and print to stdout).
 */

export function prepareCodeForExecution({ slug, language, sourceCode, inputData }) {
    if (!sourceCode || typeof sourceCode !== "string") {
        return { code: "", stdin: inputData || "" };
    }

    const trimmed = sourceCode.trim();
    const lang = (language || "").toLowerCase().trim();

    // If JavaScript
    if (lang === "javascript") {
        // If code already logs to stdout, pass directly with stdin
        if (trimmed.includes("console.log")) {
            return { code: trimmed, stdin: inputData || "" };
        }

        // LeetCode function style wrapper for known problems
        if (slug === "two-sum" && (trimmed.includes("twoSum") || trimmed.includes("function"))) {
            const wrapped = `
${trimmed}

;(() => {
    try {
        if (typeof twoSum === 'function') {
            ${inputData};
            const __ans = twoSum(nums, target);
            if (__ans !== undefined) {
                console.log(JSON.stringify(__ans));
            }
        }
    } catch (__err) {
        console.error(__err.message);
    }
})();
`;
            return { code: wrapped, stdin: "" };
        }

        if (slug === "longest-substring-without-repeating-characters" && trimmed.includes("lengthOfLongestSubstring")) {
            const wrapped = `
${trimmed}

;(() => {
    try {
        if (typeof lengthOfLongestSubstring === 'function') {
            ${inputData};
            const __ans = lengthOfLongestSubstring(s);
            if (__ans !== undefined) {
                console.log(JSON.stringify(__ans));
            }
        }
    } catch (__err) {
        console.error(__err.message);
    }
})();
`;
            return { code: wrapped, stdin: "" };
        }

        if (slug === "valid-parentheses" && trimmed.includes("isValid")) {
            const wrapped = `
${trimmed}

;(() => {
    try {
        if (typeof isValid === 'function') {
            ${inputData};
            const __ans = isValid(s);
            if (__ans !== undefined) {
                console.log(JSON.stringify(__ans));
            }
        }
    } catch (__err) {
        console.error(__err.message);
    }
})();
`;
            return { code: wrapped, stdin: "" };
        }
    }

    // If Python
    if (lang === "python") {
        if (trimmed.includes("print(")) {
            return { code: trimmed, stdin: inputData || "" };
        }

        if (slug === "two-sum" && (trimmed.includes("twoSum") || trimmed.includes("Solution"))) {
            const wrapped = `
${trimmed}

if __name__ == '__main__':
    try:
        import json
        ${inputData}
        __res = None
        if 'Solution' in globals():
            __sol = Solution()
            __res = __sol.twoSum(nums, target)
        elif 'twoSum' in globals():
            __res = twoSum(nums, target)
        if __res is not None:
            print(json.dumps(__res, separators=(',', ':')))
    except Exception as __e:
        import sys
        print(__e, file=sys.stderr)
`;
            return { code: wrapped, stdin: "" };
        }
    }

    // Default: pass original code with inputData as stdin
    return { code: trimmed, stdin: inputData || "" };
}
