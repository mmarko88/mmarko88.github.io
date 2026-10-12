---
title: "Moving Data to Functions Instead of Functions to Data: A Functional Programming Principle"
date: 2026-10-11
draft: true
tags: ["java", "functional programming", "design patterns"]
categories: ["java", "functional programming"]
featureImage: 'fp_data_oriented.svg' # Top image on post.
shareImage: 'fp_data_oriented.svg' # For SEO and social media snippets.
featureImageAlt: 'Moving data to functions in functional programming' # Alternative text for featured image.
---

## Introduction

One of the fundamental principles in functional programming is the idea of "moving data to functions instead of moving functions to data." This concept might sound abstract at first, but it represents a profound shift in how we think about structuring our code.

In traditional object-oriented programming, we're used to bundling data and behavior together in objects. We send operations to the object that owns the data - the function travels to where the data lives. Functional programming takes the opposite approach: functions stay separate, and we move the data to them to be transformed.

This article explores what this principle means, why it's beneficial, and how you can apply it in your Java code.

## What Does "Moving Data to Functions" Mean?

The core idea is simple: instead of having data carry its behavior around (as in OOP), we keep data as plain values and have separate functions that operate on that data.

### OOP Style: Moving Functions to Data

In object-oriented programming, data and behavior are tightly coupled:

```java
class Order {
    private List<Item> items;
    private Customer customer;
    
    public BigDecimal calculateTotal() {
        return items.stream()
            .map(Item::price)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    public Order applyDiscount(BigDecimal discount) {
        List<Item> discountedItems = items.stream()
            .map(item -> item.withPrice(item.price().multiply(discount)))
            .toList();
        return new Order(discountedItems, customer);
    }
}

// Usage: functions are dispatched to the data
Order order = new Order(items, customer);
BigDecimal total = order.calculateTotal();
Order discounted = order.applyDiscount(percent);
```

Here, the functions live on the data itself. When we call a method on the object, we send the operation to where the data is - the function travels to the data, which never moves.

### Functional Style: Moving Data to Functions

In functional programming, data and behavior are separated:

```java
record Order(List<Item> items, Customer customer) {}

// Functions are separate and operate on data
BigDecimal calculateTotal(Order order) {
    return order.items().stream()
        .map(Item::price)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}

Order applyDiscount(Order order, BigDecimal discount) {
    List<Item> discountedItems = order.items().stream()
        .map(item -> item.withPrice(item.price().multiply(discount)))
        .toList();
    return new Order(discountedItems, order.customer());
}

// Usage: data is passed to functions
Order order = new Order(items, customer);
BigDecimal total = calculateTotal(order);
Order discounted = applyDiscount(order, percent);
```

Here, the data is just a plain record - it stays inert, and we pass it to the functions that transform it. We move data to functions.

## Why Is This Approach Better?

### 1. Function Reusability

When functions are separate from data, you can design them to work with multiple data types through interfaces or generics. In Java, since it's statically typed, you'd typically define an interface to achieve this reusability.

```java
// Define an interface for the expected shape
interface ItemContainer {
    List<Item> items();
}

// Now the function works with any type implementing ItemContainer
BigDecimal calculateTotal(ItemContainer container) {
    return container.items().stream()
        .map(Item::price)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}

// Both Order and Invoice can implement ItemContainer
record Order(List<Item> items, Customer customer) implements ItemContainer {}
record Invoice(List<Item> items, String invoiceNumber) implements ItemContainer {}

// The same function works for both
Order order = new Order(items, customer);
Invoice invoice = new Invoice(items, "INV-001");
BigDecimal orderTotal = calculateTotal(order);
BigDecimal invoiceTotal = calculateTotal(invoice);
```

The benefit is that functions are decoupled from specific classes - they depend on abstractions (interfaces) rather than concretions. This makes it easier to reuse functions across different data structures that share the same shape, and easier to test since you can use simple test implementations.

### 2. Easy Composition

Functions can be easily composed together to create complex transformations:

```java
Order processOrder(Order order) {
    return Optional.of(order)
        .map(o -> validateOrder(o))
        .map(o -> applyDiscount(o, BigDecimal.valueOf(0.9)))
        .map(o -> calculateTax(o))
        .orElseThrow(() -> new IllegalArgumentException("Invalid order"));
}
```

Each function takes data, transforms it, and passes the result to the next function. The data flows through a pipeline of functions.

### 3. Immutability

When we move data to functions, this approach naturally promotes immutability. Instead of modifying data in place, functions return new, transformed data:

```java
// Original order is never modified
Order original = new Order(items, customer);
Order discounted = applyDiscount(original, percent);
// original is still unchanged
```

This eliminates a whole class of bugs related to shared mutable state. While you could technically have functions that visit and modify mutable data, the functional programming style encourages immutability as a best practice.

### 4. Simpler Testing

Testing becomes much simpler because you can test functions with simple data literals:

```java
@Test
void testCalculateTotal() {
    Order order = new Order(
        List.of(new Item("A", new BigDecimal("10.00"))),
        new Customer("John")
    );
    
    BigDecimal total = calculateTotal(order);
    assertEquals(new BigDecimal("10.00"), total);
}
```

No need to set up complex object graphs or use mocks.

### 5. Better Serialization

Plain data structures serialize and deserialize much more easily than complex object graphs with behavior:

```java
// A simple record can be easily converted to JSON
Order order = new Order(items, customer);
String json = objectMapper.writeValueAsString(order);

// And reconstructed just as easily
Order reconstructed = objectMapper.readValue(json, Order.class);
```

## Practical Example: Order Processing Pipeline

Let's look at a more complete example that demonstrates the power of this approach.

### The Data

```java
record Item(String sku, int quantity, BigDecimal price) {}
record Customer(String id, String name) {}
record Order(String id, Customer customer, List<Item> items, OrderStatus status) {}

enum OrderStatus {
    PENDING, VALIDATED, DISCOUNTED, TAXED, COMPLETED
}
```

### The Functions

```java
Order validateOrder(Order order) {
    if (order.customer() == null || order.items().isEmpty()) {
        throw new IllegalArgumentException("Invalid order");
    }
    return new Order(
        order.id(),
        order.customer(),
        order.items(),
        OrderStatus.VALIDATED
    );
}

Order applyDiscount(Order order, BigDecimal discountRate) {
    if (order.status() != OrderStatus.VALIDATED) {
        throw new IllegalStateException("Order must be validated first");
    }
    
    List<Item> discountedItems = order.items().stream()
        .map(item -> new Item(
            item.sku(),
            item.quantity(),
            item.price().multiply(discountRate)
        ))
        .toList();
    
    return new Order(
        order.id(),
        order.customer(),
        discountedItems,
        OrderStatus.DISCOUNTED
    );
}

Order calculateTax(Order order, BigDecimal taxRate) {
    if (order.status() != OrderStatus.DISCOUNTED) {
        throw new IllegalStateException("Order must be discounted first");
    }
    
    BigDecimal total = order.items().stream()
        .map(item -> item.price().multiply(BigDecimal.valueOf(item.quantity())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    BigDecimal tax = total.multiply(taxRate);
    
    // Add tax as a special item
    Item taxItem = new Item("TAX", 1, tax);
    List<Item> itemsWithTax = new ArrayList<>(order.items());
    itemsWithTax.add(taxItem);
    
    return new Order(
        order.id(),
        order.customer(),
        itemsWithTax,
        OrderStatus.TAXED
    );
}

Order completeOrder(Order order) {
    if (order.status() != OrderStatus.TAXED) {
        throw new IllegalStateException("Order must be taxed first");
    }
    
    return new Order(
        order.id(),
        order.customer(),
        order.items(),
        OrderStatus.COMPLETED
    );
}
```

### The Pipeline

```java
Order processOrder(Order order, BigDecimal discountRate, BigDecimal taxRate) {
    return Optional.of(order)
        .map(this::validateOrder)
        .map(o -> applyDiscount(o, discountRate))
        .map(o -> calculateTax(o, taxRate))
        .map(this::completeOrder)
        .orElseThrow(() -> new IllegalArgumentException("Order processing failed"));
}
```

Notice how each function is pure (no side effects), takes data as input, and returns new data as output. The original order is never modified.

## Performance Considerations

The functional approach of "moving data to functions" has performance implications that you should be aware of:

### Object Allocation Overhead

Creating new objects for every transformation can be expensive, especially in hot paths:

```java
// Each transformation creates a new Order object
Order validated = validateOrder(order);        // New object
Order discounted = applyDiscount(validated);    // New object
Order taxed = calculateTax(discounted);         // New object
Order completed = completeOrder(taxed);         // New object
```

In performance-critical code, this allocation overhead can be significant. The JVM is optimized for short-lived objects, but in tight loops or high-throughput systems, it can still impact performance.

### Memory Churn

Frequent object creation and garbage collection can cause memory churn, leading to:
- Increased GC pressure
- Potential GC pauses
- Cache inefficiency due to scattered object allocations

This is similar to the memory churn issue discussed in my article on [What Is Memory Churn and How to Avoid It in Java](/post/java/memory_churn/), where string concatenation created many temporary objects. The functional approach can have similar effects - each transformation creates new objects that need to be garbage collected.

### When to Use Mutable State

For performance-critical sections, you might need to use mutable state:

```java
// In a hot path, mutable state might be necessary
class MutableOrder {
    private List<Item> items;
    private OrderStatus status;
    
    public void applyDiscount(BigDecimal discount) {
        // Modify in place instead of creating new object
        this.items = items.stream()
            .map(item -> item.withPrice(item.price().multiply(discount)))
            .toList();
    }
}
```

### Mitigation Strategies

You can mitigate performance issues while still maintaining functional style:

1. **Use object pooling** for frequently created objects
2. **Lazy evaluation** - defer transformations until needed
3. **Batch operations** - process multiple items together
4. **Use primitive specializations** where possible (e.g., `IntStream` instead of `Stream<Integer>`)
5. **Profile first** - don't optimize prematurely; measure actual bottlenecks

### The Trade-off

The functional approach trades some performance for:
- Better code clarity
- Easier reasoning about state
- Simpler testing
- Fewer bugs related to shared mutable state

For most business logic, the performance difference is negligible. For hot paths and performance-critical sections, you may need to fall back to mutable state or use hybrid approaches.

## When This Approach Doesn't Work

While this approach has many benefits, it's not a silver bullet. Here are some cases where it might not be the best fit:

1. **When you need encapsulation**: Sometimes you need to hide internal details and control access to data. In these cases, OOP's encapsulation can be beneficial.

2. **When behavior is complex and tightly coupled to data**: If the behavior is very specific to a particular data structure and wouldn't make sense elsewhere, bundling them together might be more appropriate.

3. **When working with existing OOP frameworks**: Many Java frameworks (Spring, Hibernate, etc.) are designed around OOP principles and work best with objects.

4. **When overusing higher-order functions**: Passing functions as parameters everywhere can make code harder to navigate and debug. If a function breaks, the error occurs where it's called, but finding where it's defined can become difficult. Use higher-order functions judiciously and keep function definitions close to their usage.

## Conclusion

"Moving data to functions instead of functions to data" is a powerful principle that can lead to more reusable, composable, and testable code. By separating data from behavior, you gain:

- Functions that work with any compatible data structure
- Easy composition of complex transformations
- Immutable data by default
- Simpler testing with plain data literals
- Better serialization and debugging

However, like any principle, it should be applied judiciously. The key is to understand the trade-offs and choose the right approach for your specific situation.

In Java, records (introduced in Java 14) make this approach much more practical by providing immutable data carriers with minimal boilerplate. Combined with functional interfaces and the Stream API, Java developers can leverage many of the benefits of functional programming while staying within the Java ecosystem.

For more stuff like this, you can follow me on [Twitter](https://x.com/mare_milenkovic), [LinkedIn](https://www.linkedin.com/in/marko-milenkovic/).
