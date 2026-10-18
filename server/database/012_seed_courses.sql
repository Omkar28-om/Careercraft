-- Migration: 012_seed_courses.sql
-- Seed real CareerCraft courses with sections and lessons

DO $$
DECLARE
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
    course4_id UUID;
    course5_id UUID;
    
    sec_id UUID;
BEGIN

    -- 1. Python Programming Fundamentals
    INSERT INTO courses (
        title, slug, short_description, description, category, level, instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'Python Programming Fundamentals',
        'python-programming-fundamentals',
        'Master core Python syntax, data structures, control flow, functions, and object-oriented principles.',
        'Python is the world''s most versatile programming language, powering web applications, data science, machine learning, and automation. This comprehensive fundamentals course takes you from foundational variables and loops to functions, dictionary manipulations, and file handling with clean, idiomatic code examples.',
        'Programming Languages',
        'beginner',
        'Dr. Arvind Rao',
        180,
        true,
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80'
    ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = true
    RETURNING id INTO course1_id;

    -- Course 1: Section 1
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course1_id, 'Python Basics & Control Flow', 'Core syntax, variables, primitive types, and conditionals.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Variables and Data Types',
        'variables-and-data-types',
        1,
        'article',
        15,
        true,
        '# Variables and Data Types in Python

In Python, variables are dynamically typed containers for storing data values. You do not need to declare types explicitly.

### Primitive Types
- **Integers (`int`)**: Whole numbers such as `42`, `-7`, `0`.
- **Floats (`float`)**: Decimal numbers such as `3.14159`, `-0.001`.
- **Strings (`str`)**: Text enclosed in single or double quotes: `"CareerCraft"`.
- **Booleans (`bool`)**: Either `True` or `False`.

```python
# Variable declarations
user_name = "Alex"
user_xp = 120
is_active = True
completion_rate = 94.5

print(f"User: {user_name}, XP: {user_xp}, Active: {is_active}")
```

### Type Conversion
You can explicitly cast between types using built-in functions:
```python
age_str = "21"
age_int = int(age_str)
price_float = float("19.99")
```

Always ensure input strings are validated before casting to prevent `ValueError` runtime exceptions.'
    ),
    (
        sec_id,
        'Conditions and Loops',
        'conditions-and-loops',
        2,
        'article',
        20,
        false,
        '# Conditions and Loops in Python

Control flow statements enable your Python programs to make decisions and execute blocks of code repeatedly.

### Conditional Statements (`if`, `elif`, `else`)
```python
score = 85

if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
else:
    grade = "C"

print(f"Calculated Grade: {grade}")
```

### Iteration with For Loops
The `for` statement iterates over elements of any sequence (such as lists or ranges):
```python
# Iterating through a range
for i in range(1, 6):
    print(f"Step {i}: Progressing toward mastery")
```

### While Loops and Guard Clauses
Use `while` loops when iteration continues until a condition changes:
```python
attempts = 3
while attempts > 0:
    print(f"Attempts remaining: {attempts}")
    attempts -= 1
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

    -- Course 1: Section 2
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course1_id, 'Functions and Collections', 'Reusable modular code, lists, dictionaries, and sets.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Functions and Parameters',
        'functions-and-parameters',
        1,
        'article',
        25,
        false,
        '# Functions and Modular Code in Python

Functions are reusable blocks of code that accept arguments and return computed results using the `def` keyword.

### Defining Functions
```python
def calculate_xp_bonus(base_xp: int, streak_days: int) -> int:
    """Calculates total student XP including streak multipliers."""
    multiplier = 1.0 + min(streak_days * 0.05, 0.5)
    return int(base_xp * multiplier)

total = calculate_xp_bonus(100, 7)
print("Earned XP:", total)
```

### Keyword Arguments and Default Values
```python
def enroll_student(name: str, course: str = "Python Fundamentals"):
    print(f"Enrolling {name} into {course}")
```'
    ),
    (
        sec_id,
        'Lists and Dictionaries',
        'lists-and-dictionaries',
        2,
        'article',
        25,
        false,
        '# Working with Lists and Dictionaries

Lists and dictionaries are the backbone of data processing in Python.

### Lists (Ordered, Mutable)
```python
technologies = ["Python", "PostgreSQL", "React"]
technologies.append("Docker")
print("First tech:", technologies[0])
```

### Dictionaries (Key-Value Mappings)
```python
student_profile = {
    "name": "Sarah Chen",
    "level": 3,
    "skills": ["Python", "SQL"]
}

# Safe lookup with default
role = student_profile.get("role", "Student")
print(f"Role: {role}")
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;


    -- 2. Java Programming Fundamentals
    INSERT INTO courses (
        title, slug, short_description, description, category, level, instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'Java Programming Fundamentals',
        'java-programming-fundamentals',
        'Understand object-oriented programming, classes, interfaces, memory management, and robust exception handling.',
        'Java is an enterprise-grade standard for distributed backend systems, Android applications, and financial engineering. In this course, learn the principles of strong typing, JVM internals, encapsulation, polymorphism, inheritance, and the Collections Framework.',
        'Programming Languages',
        'intermediate',
        'Sarah Jenkins',
        240,
        true,
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80'
    ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = true
    RETURNING id INTO course2_id;

    -- Course 2: Section 1
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course2_id, 'OOP Core Principles', 'Classes, objects, constructors, and encapsulation in Java.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Classes and Objects',
        'classes-and-objects',
        1,
        'article',
        20,
        true,
        '# Classes and Objects in Java

Java is a class-based, object-oriented language. Everything in Java belongs to a class.

```java
public class Student {
    private String name;
    private int xp;

    public Student(String name, int initialXp) {
        this.name = name;
        this.xp = initialXp;
    }

    public void awardXp(int points) {
        if (points > 0) {
            this.xp += points;
        }
    }

    public int getXp() {
        return this.xp;
    }
}
```'
    ),
    (
        sec_id,
        'Inheritance and Polymorphism',
        'inheritance-and-polymorphism',
        2,
        'article',
        25,
        false,
        '# Inheritance and Polymorphism in Java

Java enables subclassing via `extends` and interface implementation via `implements`.

```java
public interface ProblemSolver {
    boolean solve();
}

public class AlgorithmicSolver implements ProblemSolver {
    @Override
    public boolean solve() {
        System.out.println("Executing O(N log N) algorithm");
        return true;
    }
}
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

    -- Course 2: Section 2
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course2_id, 'Collections & Exception Handling', 'Lists, Maps, Sets, and robust error management.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Java Collections Framework',
        'java-collections-framework',
        1,
        'article',
        30,
        false,
        '# Java Collections Framework

The Java Collections Framework standardizes data structures:
- `ArrayList<E>`: Dynamic resizable arrays.
- `HashSet<E>`: O(1) average lookup uniqueness.
- `HashMap<K, V>`: Key-value pair hash table.

```java
import java.util.*;

List<String> list = new ArrayList<>();
list.add("Recursion");
list.add("Dynamic Programming");

Map<String, Integer> map = new HashMap<>();
map.put("Two Sum", 100);
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;


    -- 3. Web Development Fundamentals
    INSERT INTO courses (
        title, slug, short_description, description, category, level, instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'Web Development Fundamentals',
        'web-development-fundamentals',
        'Build responsive, production-ready web apps with modern HTML5, CSS3, JavaScript, and HTTP APIs.',
        'Learn the foundational building blocks of the modern internet. Master the Document Object Model (DOM), asynchronous JavaScript, Fetch API, modern semantic markup, responsive layout grids, flexbox, and client-server HTTP communication.',
        'Web Development',
        'beginner',
        'Sarah Jenkins',
        210,
        true,
        'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=80'
    ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = true
    RETURNING id INTO course3_id;

    -- Course 3: Section 1
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course3_id, 'HTML5 & Modern CSS', 'Semantic tags, Flexbox, and CSS Grid layouts.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Semantic HTML and Accessibility',
        'semantic-html-and-accessibility',
        1,
        'article',
        15,
        true,
        '# Semantic HTML and Accessibility

Semantic HTML tags communicate meaning to search engines, screen readers, and developers.

```html
<header>
  <nav aria-label="Main Navigation">
    <a href="/courses">Courses</a>
  </nav>
</header>

<main>
  <article>
    <h1>Web Architecture</h1>
    <p>Understanding client-server separation.</p>
  </article>
</main>
```'
    ),
    (
        sec_id,
        'Modern Flexbox and Grid',
        'modern-flexbox-and-grid',
        2,
        'article',
        20,
        false,
        '# CSS Layouts: Flexbox and Grid

- **Flexbox**: Ideal for 1-dimensional layouts (rows or columns).
- **CSS Grid**: Built for 2-dimensional layouts (rows AND columns simultaneously).

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

    -- Course 3: Section 2
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course3_id, 'Asynchronous JavaScript & APIs', 'Promises, async/await, and REST API communication.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Async Await and the Fetch API',
        'async-await-and-the-fetch-api',
        1,
        'article',
        25,
        false,
        '# Asynchronous JavaScript & Fetch API

Handling asynchronous network I/O cleanly with `async` and `await`:

```javascript
async function loadCourseProgress(slug) {
  try {
    const res = await fetch(`/api/courses/${slug}/progress`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to load progress:", err);
  }
}
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;


    -- 4. SQL & Database Fundamentals
    INSERT INTO courses (
        title, slug, short_description, description, category, level, instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'SQL & Database Fundamentals',
        'sql-and-database-fundamentals',
        'Design relational schemas, query data with SQL, write joins, manage transactions, and build performant indexes.',
        'Relational databases are the data foundation of software engineering. Learn relational design, primary and foreign keys, joins, aggregation, grouping, indexing strategies, transactions, ACID guarantees, and PostgreSQL-specific features like JSONB and triggers.',
        'Databases',
        'beginner',
        'Michael Chang',
        195,
        true,
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80'
    ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = true
    RETURNING id INTO course4_id;

    -- Course 4: Section 1
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course4_id, 'Relational Queries & Filtering', 'SELECT, WHERE, ORDER BY, GROUP BY, and Aggregation.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Core SQL Querying and Filtering',
        'core-sql-querying-and-filtering',
        1,
        'article',
        20,
        true,
        '# SQL Querying and Filtering

Relational databases use declarative Structured Query Language (SQL).

```sql
SELECT title, category, level, duration_minutes
FROM courses
WHERE is_published = true AND level = ''beginner''
ORDER BY duration_minutes ASC;
```'
    ),
    (
        sec_id,
        'Joins and Relationships',
        'joins-and-relationships',
        2,
        'article',
        25,
        false,
        '# SQL Joins: Combining Related Tables

- **INNER JOIN**: Returns rows with matching keys in both tables.
- **LEFT JOIN**: Returns all rows from left table and matched rows from right table.

```sql
SELECT c.title AS course_title, s.title AS section_title, l.title AS lesson_title
FROM courses c
JOIN course_sections s ON c.id = s.course_id
JOIN course_lessons l ON s.id = l.section_id
WHERE c.is_published = true
ORDER BY s.section_order, l.lesson_order;
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

    -- Course 4: Section 2
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course4_id, 'Transactions and Indexing', 'ACID transactions, B-Tree indexes, and performance optimization.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'ACID Transactions and Locking',
        'acid-transactions-and-locking',
        1,
        'article',
        25,
        false,
        '# ACID Transactions

A transaction is an atomic unit of database operations:
- **Atomicity**: All statements succeed or none do.
- **Consistency**: Preserves schema constraints.
- **Isolation**: Concurrent executions do not cross-contaminate.
- **Durability**: Committed data survives system crashes.

```sql
BEGIN;
UPDATE student_progress SET total_xp = total_xp + 25 WHERE user_id = $1;
INSERT INTO user_activity (user_id, activity_type, xp_earned) VALUES ($1, ''course_completed'', 25);
COMMIT;
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;


    -- 5. Data Structures & Algorithms
    INSERT INTO courses (
        title, slug, short_description, description, category, level, instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'Data Structures & Algorithms',
        'data-structures-and-algorithms',
        'Master asymptotic complexity, arrays, hash tables, two pointers, sliding window, trees, and dynamic programming.',
        'Data Structures and Algorithms form the foundation of technical interviews and performant software engineering. Master time and space complexity (Big-O), arrays, hashing, stacks, queues, binary search trees, graph traversals, and dynamic programming patterns.',
        'Data Structures & Algorithms',
        'advanced',
        'Karan Mehta',
        300,
        true,
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80'
    ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = true
    RETURNING id INTO course5_id;

    -- Course 5: Section 1
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course5_id, 'Asymptotic Complexity & Arrays', 'Big-O notation, Two Pointers, and Sliding Window.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Big-O Notation and Complexity Analysis',
        'big-o-notation-and-complexity-analysis',
        1,
        'article',
        20,
        true,
        '# Big-O Notation and Complexity Analysis

Big-O notation describes the upper bound of an algorithm''s execution time or memory requirements relative to input size $N$.

### Common Complexities
- $O(1)$: Constant time (array index access, hash map lookup).
- $O(\\log N)$: Logarithmic time (binary search).
- $O(N)$: Linear time (single pass through array).
- $O(N \\log N)$: Linearithmic time (Merge sort, Quick sort).
- $O(N^2)$: Quadratic time (nested loops over input).
- $O(2^N)$: Exponential time (naive recursive Fibonacci).'
    ),
    (
        sec_id,
        'Two Pointer Technique',
        'two-pointer-technique',
        2,
        'article',
        25,
        false,
        '# The Two Pointer Technique

The two pointer pattern uses two indexes that move toward or alongside each other to achieve $O(N)$ runtime instead of $O(N^2)$.

```python
def two_sum_sorted(numbers, target):
    left = 0
    right = len(numbers) - 1
    
    while left < right:
        curr_sum = numbers[left] + numbers[right]
        if curr_sum == target:
            return [left + 1, right + 1]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return []
```'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

    -- Course 5: Section 2
    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (course5_id, 'Hashing and Trees', 'Hash maps, binary search trees, and recursion.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (
        sec_id,
        'Hash Tables and Fast Lookup',
        'hash-tables-and-fast-lookup',
        1,
        'article',
        30,
        false,
        '# Hash Tables & Fast Key-Value Lookup

Hash tables compute an index into an array of buckets using a hashing function. They provide average $O(1)$ insertions, lookups, and deletions.

In technical interviews, trading space for time using a hash table is the most frequently tested optimization pattern.'
    )
    ON CONFLICT (section_id, lesson_order) DO NOTHING;

END $$;
