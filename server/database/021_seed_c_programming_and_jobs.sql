-- Seed a beginner C course and a matching sample opportunity.
-- Java fundamentals and Java-related job listings are already present in
-- migrations 012 and 014, so this migration fills the missing C pathway.

DO $$
DECLARE
    c_course_id UUID;
    c_basics_id UUID;
    c_control_id UUID;
    c_arrays_id UUID;
    c_pointers_id UUID;
    c_structs_id UUID;
    java_course_id UUID;
    java_basics_id UUID;
BEGIN
    -- Java fundamentals already exists. Add the missing beginner material at
    -- the start of that course while preserving its OOP and collections lessons.
    UPDATE courses
    SET level = 'beginner',
        duration_minutes = GREATEST(COALESCE(duration_minutes, 0), 360),
        short_description = 'Start with Java syntax and build toward object-oriented programming, collections, and practical application development.',
        description = 'A beginner-friendly path through Java. Learn to compile and run a program, work with types and control flow, write methods, then continue into classes, inheritance, collections, and exception handling.'
    WHERE slug = 'java-programming-fundamentals'
    RETURNING id INTO java_course_id;

    IF java_course_id IS NOT NULL THEN
        INSERT INTO course_sections (course_id, title, description, section_order)
        VALUES (java_course_id, 'Java Syntax and Problem Solving', 'Get a Java program running and learn the language building blocks.', 0)
        ON CONFLICT (course_id, section_order) DO UPDATE SET
            title = EXCLUDED.title, description = EXCLUDED.description
        RETURNING id INTO java_basics_id;

        INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
        VALUES
        (java_basics_id, 'Compile and Run Your First Program', 'java-first-program', 1, 'article', 20, true,
         $lesson$# Your First Java Program

Java source code is compiled to bytecode and run by the Java Virtual Machine. Save this example as `HelloCareerCraft.java`:

```java
public class HelloCareerCraft {
    public static void main(String[] args) {
        System.out.println("Hello, CareerCraft!");
    }
}
```

The public class name must match the file name. With a JDK installed, run `javac HelloCareerCraft.java` and then `java HelloCareerCraft`. `main` is where this program begins.$lesson$),
        (java_basics_id, 'Variables and Types', 'java-variables-types', 2, 'article', 25, false,
         $lesson$# Variables and Types

Java is statically typed: every variable has a declared type. Primitive types include `int`, `long`, `double`, `char`, and `boolean`; `String` is a standard library class.

```java
String name = "Asha";
int completedLessons = 3;
boolean enrolled = true;
System.out.println(name + " completed " + completedLessons + " lessons.");
```

Choose a type that fits the value, initialize local variables before reading them, and use descriptive names. `final` marks a variable that should not be reassigned.$lesson$),
        (java_basics_id, 'Conditions and Loops', 'java-conditions-loops', 3, 'article', 25, false,
         $lesson$# Conditions and Loops

Use `if`, `else if`, and `else` to branch. A `for` loop is useful for a known range; a `while` loop repeats while its condition is true.

```java
for (int lesson = 1; lesson <= 3; lesson++) {
    System.out.println("Lesson " + lesson);
}
```

Java conditions must be boolean expressions. For arrays and lists, indexes start at zero. Practice by summing a list of scores and counting how many meet a passing threshold.$lesson$),
        (java_basics_id, 'Methods and Arrays', 'java-methods-arrays', 4, 'article', 30, false,
         $lesson$# Methods and Arrays

Methods package a focused operation for reuse. Parameters have types, and a method declares its return type.

```java
static int total(int[] scores) {
    int sum = 0;
    for (int score : scores) {
        sum += score;
    }
    return sum;
}
```

An array has a fixed length, available through `.length`. Split a longer task into small methods, pass the data each method needs, and test empty, single-element, and typical arrays.$lesson$)
        ON CONFLICT (section_id, lesson_order) DO UPDATE SET
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            lesson_type = EXCLUDED.lesson_type,
            duration_minutes = EXCLUDED.duration_minutes,
            is_preview = EXCLUDED.is_preview,
            content = EXCLUDED.content;
    END IF;

    INSERT INTO courses (
        title, slug, short_description, description, category, level,
        instructor_name, duration_minutes, is_published, thumbnail_url
    ) VALUES (
        'C Programming Fundamentals',
        'c-programming-fundamentals',
        'Learn C from the first program through functions, arrays, pointers, structs, and memory-safe habits.',
        'Build a strong systems-programming foundation with C. Work through compilation, data types, control flow, functions, arrays, strings, pointers, structures, and dynamic memory, with small exercises that prepare you for embedded and junior systems roles.',
        'Programming Languages',
        'beginner',
        'CareerCraft Learning Team',
        300,
        true,
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80'
    )
    ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        short_description = EXCLUDED.short_description,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        level = EXCLUDED.level,
        duration_minutes = EXCLUDED.duration_minutes,
        is_published = true
    RETURNING id INTO c_course_id;

    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (c_course_id, 'C Setup and Core Syntax', 'Compile a first program and understand values, types, and input/output.', 1)
    ON CONFLICT (course_id, section_order) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO c_basics_id;

    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (c_course_id, 'Decisions, Loops, and Functions', 'Control program flow and break problems into reusable functions.', 2)
    ON CONFLICT (course_id, section_order) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO c_control_id;

    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (c_course_id, 'Arrays and Strings', 'Store collections of values and work safely with C strings.', 3)
    ON CONFLICT (course_id, section_order) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO c_arrays_id;

    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (c_course_id, 'Pointers and Memory', 'Understand addresses, pointers, and dynamic allocation.', 4)
    ON CONFLICT (course_id, section_order) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO c_pointers_id;

    INSERT INTO course_sections (course_id, title, description, section_order)
    VALUES (c_course_id, 'Structures and Mini Project', 'Model related data with structs and build a small console project.', 5)
    ON CONFLICT (course_id, section_order) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id INTO c_structs_id;

    INSERT INTO course_lessons (section_id, title, slug, lesson_order, lesson_type, duration_minutes, is_preview, content)
    VALUES
    (c_basics_id, 'Your First C Program', 'c-first-program', 1, 'article', 20, true,
     $lesson$# Your First C Program

C is a compiled language. Save a source file as `hello.c`, compile it with a C compiler, and run the resulting program.

```c
#include <stdio.h>

int main(void) {
    printf("Hello, CareerCraft!\\n");
    return 0;
}
```

`#include` makes standard input/output declarations available. `main` is the program entry point, and returning `0` signals success. With GCC or Clang, compile using `cc -Wall -Wextra -std=c17 hello.c -o hello`. Warnings help catch mistakes early.$lesson$),
    (c_basics_id, 'Types, Variables, and Input', 'c-types-variables-input', 2, 'article', 25, false,
     $lesson$# Types, Variables, and Input

C variables have declared types. Common beginner types include `int`, `char`, `float`, and `double`.

```c
#include <stdio.h>

int main(void) {
    int age = 20;
    printf("Age: %d\\n", age);
    return 0;
}
```

Use a matching format specifier (`%d` for `int`, `%c` for `char`, `%f` for `float`). `scanf` can read input, but always check its return value and validate input before using it. Prefer clear names and initialize variables before reading them.$lesson$),
    (c_control_id, 'Conditions and Loops', 'c-conditions-loops', 1, 'article', 25, false,
     $lesson$# Conditions and Loops

Use `if`, `else if`, and `else` to choose a path. `for` works well when the number of iterations is known; `while` repeats while a condition remains true.

```c
for (int i = 1; i <= 5; i++) {
    printf("%d\\n", i);
}
```

In C, zero is false and nonzero is true. Watch loop bounds carefully: array indexes start at zero, and reading beyond an array is undefined behavior. Try writing a program that sums the integers from 1 through `n`.$lesson$),
    (c_control_id, 'Functions and Scope', 'c-functions-scope', 2, 'article', 25, false,
     $lesson$# Functions and Scope

Functions give a name to a focused task. Declare a function before it is called, give its parameters types, and return a value when appropriate.

```c
int add(int left, int right) {
    return left + right;
}
```

The declaration `int add(int left, int right);` is a prototype. Variables declared inside a function have local scope. Pass small values directly; use pointers when a function needs to modify a caller''s object or work with an array.$lesson$),
    (c_arrays_id, 'Arrays and Bounds', 'c-arrays-bounds', 1, 'article', 25, false,
     $lesson$# Arrays and Bounds

An array stores a fixed number of values of one type contiguously. Its first element is at index zero.

```c
int scores[] = {82, 91, 76};
size_t count = sizeof scores / sizeof scores[0];
for (size_t i = 0; i < count; i++) {
    printf("%d\\n", scores[i]);
}
```

When an array is passed to a function it does not carry its length, so pass the element count separately. Keep every index within `[0, count)`. Use `size_t` for sizes and indexes.$lesson$),
    (c_arrays_id, 'Strings and Safe Input', 'c-strings-safe-input', 2, 'article', 25, false,
     $lesson$# Strings and Safe Input

A C string is a character array ending with the null character `\\0`. The array must have room for that terminator as well as the text.

```c
char name[32];
if (fgets(name, sizeof name, stdin) != NULL) {
    printf("Hello, %s", name);
}
```

`fgets` limits the number of bytes read to the buffer capacity. Avoid unbounded input functions such as `gets`. Check whether input succeeded and handle a trailing newline when your program needs a clean string.$lesson$),
    (c_pointers_id, 'Addresses and Pointers', 'c-addresses-pointers', 1, 'article', 30, false,
     $lesson$# Addresses and Pointers

A pointer stores an address. `&value` obtains an object''s address, while `*pointer` accesses the pointed-to object.

```c
int score = 10;
int *score_ptr = &score;
*score_ptr = 12;
```

Always initialize pointers. A pointer must refer to a live object before it is dereferenced; use `NULL` to represent “no object” and check it before use. Array parameters are commonly written as pointers, so track the associated length explicitly.$lesson$),
    (c_pointers_id, 'Dynamic Memory', 'c-dynamic-memory', 2, 'article', 30, false,
     $lesson$# Dynamic Memory

Use `malloc` or `calloc` when a size is only known at runtime, and release successful allocations with `free` when they are no longer needed.

```c
#include <stdlib.h>

size_t count = 10;
int *values = malloc(count * sizeof *values);
if (values == NULL) {
    /* Handle allocation failure. */
} else {
    /* Use values[0] through values[count - 1]. */
    free(values);
}
```

Do not use memory after freeing it, free it twice, or forget to free owned allocations. Check multiplication and input sizes when allocating from untrusted values.$lesson$),
    (c_structs_id, 'Structs and Project: Grade Tracker', 'c-structs-grade-tracker', 1, 'article', 40, false,
     $lesson$# Structs and a Grade Tracker

Structures group related fields into one type.

```c
typedef struct {
    char name[32];
    int score;
} Student;
```

Build a console grade tracker that reads a small set of students, validates each score, calculates the average, and prints a summary. Use functions for input, average calculation, and display. As a final review, compile with `-Wall -Wextra`, test empty and boundary inputs, and explain which function owns any dynamically allocated memory.$lesson$)
    ON CONFLICT (section_id, lesson_order) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        lesson_type = EXCLUDED.lesson_type,
        duration_minutes = EXCLUDED.duration_minutes,
        is_preview = EXCLUDED.is_preview,
        content = EXCLUDED.content;

    -- Preserve attribution in the rendered lessons. The lesson text is an
    -- original explanation aligned to these external curricula and tutorials.
    UPDATE course_lessons l
    SET content = concat_ws(E'\n\n', NULLIF(l.content, ''),
        'Further reading: [Learn-C.org — Interactive C tutorial](https://learn-c.org/) · [GeeksforGeeks — C programming tutorial](https://www.geeksforgeeks.org/c/getting-started-with-c/)')
    FROM course_sections s
    WHERE l.section_id = s.id
      AND s.course_id = c_course_id
      AND l.content NOT LIKE '%Learn-C.org — Interactive C tutorial%';

    IF java_course_id IS NOT NULL THEN
        UPDATE course_lessons l
        SET content = concat_ws(E'\n\n', NULLIF(l.content, ''),
            'Further reading: [Dev.java — Learn Java](https://dev.java/learn/) · [GeeksforGeeks — Java tutorial](https://www.geeksforgeeks.org/java/java/)')
        FROM course_sections s
        WHERE l.section_id = s.id
          AND s.course_id = java_course_id
          AND l.content NOT LIKE '%Dev.java — Learn Java%';
    END IF;
END $$;

-- A sample entry-level C role gives learners a relevant destination in Jobs.
-- Java roles (including Infosys and related software listings) already exist
-- in migration 014 and remain discoverable through their Java skill tags.
INSERT INTO jobs (
    title, company_name, company_logo_url, description, job_type,
    employment_type, location, work_mode, salary_min, salary_max,
    salary_currency, skills, requirements, responsibilities, eligibility,
    application_url, application_deadline, category, experience_level, is_active
)
SELECT
    'Embedded C Developer Intern',
    'CareerCraft Demo Partner',
    NULL,
    'Sample student internship for practicing C fundamentals on embedded and low-level software tasks. This demo listing is intended for learning and portfolio preparation.',
    'internship',
    'internship',
    'Bengaluru, India',
    'hybrid',
    15000,
    25000,
    'INR',
    '["C", "Embedded Systems", "Pointers", "Data Structures", "Git"]'::jsonb,
    '["Currently enrolled in a computer science, electronics, or related degree", "Completed introductory C programming and can explain arrays, pointers, and structs", "Able to share a small C project or coding sample"]'::jsonb,
    '["Implement and debug small C modules under mentor guidance", "Write clear comments and basic tests for assigned tasks", "Document build steps and participate in code reviews"]'::jsonb,
    'Open to students and recent graduates; sample listing for CareerCraft learning demos',
    'https://careercraft.local/demo',
    '2027-03-31',
    'Embedded Systems',
    'fresher',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM jobs
    WHERE title = 'Embedded C Developer Intern'
      AND company_name = 'CareerCraft Demo Partner'
);
