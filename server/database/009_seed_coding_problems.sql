-- Migration 009: Seed initial coding problems and sample test cases
-- Preserves existing problem definitions and sample test cases from CareerCraft frontend

-- 1. Insert/Update coding_problems
INSERT INTO coding_problems (
    slug, title, description, difficulty, category, tags, constraints, examples, starter_code, is_published
)
VALUES
(
    'two-sum',
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    'Easy',
    'Array',
    '["Array", "Hash Table"]'::jsonb,
    '2 ≤ nums.length ≤ 10⁴\n-10⁹ ≤ nums[i] ≤ 10⁹\n-10⁹ ≤ target ≤ 10⁹\nOnly one valid answer exists.',
    '[
        {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."},
        {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"},
        {"input": "nums = [3,3], target = 6", "output": "[0,1]"}
    ]'::jsonb,
    '{
        "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}",
        "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []",
        "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n};",
        "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> numMap;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (numMap.count(complement)) {\n                return {numMap[complement], i};\n            }\n            numMap[nums[i]] = i;\n        }\n        return {};\n    }\n};"
    }'::jsonb,
    true
),
(
    'reverse-linked-list',
    'Reverse Linked List',
    'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    'Easy',
    'Linked List',
    '["Linked List", "Recursion"]'::jsonb,
    'The number of nodes in the list is the range [0, 5000].\n-5000 ≤ Node.val ≤ 5000',
    '[
        {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"},
        {"input": "head = [1,2]", "output": "[2,1]"}
    ]'::jsonb,
    '{
        "javascript": "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    let prev = null;\n    let curr = head;\n    while (curr !== null) {\n        let nextTemp = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n};",
        "python": "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        prev = None\n        curr = head\n        while curr:\n            next_temp = curr.next\n            curr.next = prev\n            prev = curr\n            curr = next_temp\n        return prev"
    }'::jsonb,
    true
),
(
    'longest-substring-without-repeating-characters',
    'Longest Substring Without Repeating Characters',
    'Given a string s, find the length of the longest substring without repeating characters.',
    'Medium',
    'String',
    '["String", "Sliding Window", "Hash Table"]'::jsonb,
    '0 ≤ s.length ≤ 5 * 10⁴\ns consists of English letters, digits, symbols and spaces.',
    '[
        {"input": "s = \"abcabcbb\"", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."},
        {"input": "s = \"bbbbb\"", "output": "1", "explanation": "The answer is \"b\", with the length of 1."}
    ]'::jsonb,
    '{
        "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    let maxLen = 0;\n    let set = new Set();\n    let left = 0;\n    for (let right = 0; right < s.length; right++) {\n        while (set.has(s[right])) {\n            set.delete(s[left]);\n            left++;\n        }\n        set.add(s[right]);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n};",
        "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_set = set()\n        left = 0\n        res = 0\n        for right in range(len(s)):\n            while s[right] in char_set:\n                char_set.remove(s[left])\n                left += 1\n            char_set.add(s[right])\n            res = max(res, right - left + 1)\n        return res"
    }'::jsonb,
    true
),
(
    'binary-tree-level-order-traversal',
    'Binary Tree Level Order Traversal',
    'Given the root of a binary tree, return the level order traversal of its nodes values (i.e., from left to right, level by level).',
    'Medium',
    'Tree',
    '["Tree", "BFS", "Binary Tree"]'::jsonb,
    'The number of nodes in the tree is in the range [0, 2000].\n-1000 ≤ Node.val ≤ 1000',
    '[
        {"input": "root = [3,9,20,null,null,15,7]", "output": "[[3],[9,20],[15,7]]"},
        {"input": "root = [1]", "output": "[[1]]"}
    ]'::jsonb,
    '{}'::jsonb,
    true
),
(
    'merge-k-sorted-lists',
    'Merge K Sorted Lists',
    'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    'Hard',
    'Linked List',
    '["Linked List", "Heap", "Divide and Conquer"]'::jsonb,
    'k == lists.length\n0 ≤ k ≤ 10⁴\n0 ≤ lists[i].length ≤ 500\n-10⁴ ≤ lists[i][j] ≤ 10⁴',
    '[
        {"input": "lists = [[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]"}
    ]'::jsonb,
    '{}'::jsonb,
    true
),
(
    'valid-parentheses',
    'Valid Parentheses',
    'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.',
    'Easy',
    'String',
    '["String", "Stack"]'::jsonb,
    '1 ≤ s.length ≤ 10⁴\ns consists of parentheses only ''()[]{}''.',
    '[
        {"input": "s = \"()\"", "output": "true"},
        {"input": "s = \"()[]{}\"", "output": "true"},
        {"input": "s = \"(]\"", "output": "false"}
    ]'::jsonb,
    '{}'::jsonb,
    true
),
(
    'trapping-rain-water',
    'Trapping Rain Water',
    'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    'Hard',
    'Array',
    '["Array", "Two Pointers", "Dynamic Programming"]'::jsonb,
    'n == height.length\n1 ≤ n ≤ 2 * 10⁴\n0 ≤ height[i] ≤ 10⁵',
    '[
        {"input": "height = [0,1,0,2,1,0,1,3,2,1,2,1]", "output": "6"}
    ]'::jsonb,
    '{}'::jsonb,
    true
),
(
    'coin-change',
    'Coin Change',
    'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount.',
    'Medium',
    'Dynamic Programming',
    '["Dynamic Programming", "BFS"]'::jsonb,
    '1 ≤ coins.length ≤ 12\n1 ≤ coins[i] ≤ 2³¹ - 1\n0 ≤ amount ≤ 10⁴',
    '[
        {"input": "coins = [1,2,5], amount = 11", "output": "3"},
        {"input": "coins = [2], amount = 3", "output": "-1"}
    ]'::jsonb,
    '{}'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    constraints = EXCLUDED.constraints,
    examples = EXCLUDED.examples,
    starter_code = EXCLUDED.starter_code,
    is_published = EXCLUDED.is_published,
    updated_at = NOW();

-- 2. Seed explicit sample test cases for problems with available project data
-- Two Sum sample test cases
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 'nums = [2,7,11,15], target = 9', '[0,1]', true, false, 1
FROM coding_problems WHERE slug = 'two-sum'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'two-sum' AND tc.test_order = 1
);

INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 'nums = [3,2,4], target = 6', '[1,2]', true, false, 2
FROM coding_problems WHERE slug = 'two-sum'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'two-sum' AND tc.test_order = 2
);

INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 'nums = [3,3], target = 6', '[0,1]', true, false, 3
FROM coding_problems WHERE slug = 'two-sum'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'two-sum' AND tc.test_order = 3
);

-- Reverse Linked List sample test cases
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 'head = [1,2,3,4,5]', '[5,4,3,2,1]', true, false, 1
FROM coding_problems WHERE slug = 'reverse-linked-list'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'reverse-linked-list' AND tc.test_order = 1
);

INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 'head = [1,2]', '[2,1]', true, false, 2
FROM coding_problems WHERE slug = 'reverse-linked-list'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'reverse-linked-list' AND tc.test_order = 2
);

-- Longest Substring Without Repeating Characters sample test cases
INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 's = "abcabcbb"', '3', true, false, 1
FROM coding_problems WHERE slug = 'longest-substring-without-repeating-characters'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'longest-substring-without-repeating-characters' AND tc.test_order = 1
);

INSERT INTO coding_test_cases (problem_id, input_data, expected_output, is_sample, is_hidden, test_order)
SELECT id, 's = "bbbbb"', '1', true, false, 2
FROM coding_problems WHERE slug = 'longest-substring-without-repeating-characters'
AND NOT EXISTS (
    SELECT 1 FROM coding_test_cases tc
    JOIN coding_problems p ON tc.problem_id = p.id
    WHERE p.slug = 'longest-substring-without-repeating-characters' AND tc.test_order = 2
);
