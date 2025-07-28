# Umbilical Component Protocol

A minimal protocol for JavaScript component loading based on a single constraint: components should have one function `create` that takes a single object through which all communication and resources flow.

## Core Concept

Every component exposes exactly one function:

```js
Component.create(umbilical)
```

**The umbilical object is the component's entire world.** Everything the component needs - DOM access, data sources, event handling, lifecycle management, network capabilities - must come through this single object interface.

The component can do whatever it likes internally, but it cannot access anything outside of what's provided in the umbilical. This creates perfect isolation while enabling unlimited internal complexity.

## Key Principles

### 1. Single Point of Contact
- One function: `create(umbilical)`
- No return value required
- No global dependencies
- No side effects outside the umbilical

### 2. Environmental Adaptation
Components adapt their behavior based on what capabilities you provide:

```js
// Give it DOM tools → it renders
Component.create({
  dom: element,
  data: source,
  events: bus
})

// Give it introspection tools → it describes itself  
Component.create({
  describe: documenter,
  validate: validator,
  schema: builder
})

// Give it both → it can do both
Component.create({
  dom: element,
  introspect: inspector,
  spawn: instanceFactory
})
```

### 3. Capability-Based Architecture
The host system acts as a resource broker, providing only the capabilities each component should have access to. This enables:

- **Security:** Components can only do what you explicitly enable
- **Testing:** Mock the umbilical object for complete isolation
- **Debugging:** Wrap/proxy umbilical methods to monitor behavior
- **Hot-swapping:** Replace components with identical umbilical interfaces

## Recommended Pattern: Introspection + Instantiation

While not required by the protocol, the recommended pattern is to use the same `create()` function for both type introspection and instance creation:

```js
// First: discover requirements using introspection umbilical
const typeInfo = Component.create({
  describe: (requirements) => {
    requirements.add('dom', 'HTMLElement')
    requirements.add('data', 'AsyncIterable')
    requirements.add('events', 'EventBus')
  },
  validate: (testUmbilical) => {
    return testUmbilical.dom && testUmbilical.data
  }
})

// Then: create instances using the discovered requirements
const instance1 = Component.create({
  dom: element1,
  data: dataSource1,
  events: eventBus1
})

const instance2 = Component.create({
  dom: element2,
  data: dataSource2, 
  events: eventBus2
})
```

This approach provides:
- **Single interface consistency** - same `create()` function for everything
- **Natural caching** - discover requirements once, instantiate many times
- **Flexible discovery** - introspection umbilical can be as rich as needed

## Examples

### Basic Component Instance
```js
// Audio visualizer
AudioViz.create({
  canvas: canvasElement,
  audioContext: webAudioContext,
  scheduler: rafScheduler,
  onDestroy: cleanupCallback
})

// Data grid
DataGrid.create({
  container: domElement,
  dataSource: asyncIterator,
  formatter: columnFormatter,
  selection: selectionManager
})
```

### Progressive Enhancement
```js
// Basic functionality first
Component.create({
  dom: element,
  data: basicData
})

// Later, add enhanced capabilities
Component.create({
  dom: element,
  data: richData,
  analytics: tracker,
  realtime: websocket
})
```

## Benefits

### Perfect Isolation
Components literally cannot create side effects outside their sandbox. No accidental global mutations, no surprise network calls, no DOM manipulation outside their boundaries.

### Universal Testing
Mock the single umbilical object and you can test any component in complete isolation, regardless of its internal complexity.

### Runtime Introspection
The host can log, measure, rate-limit, or modify any component behavior by controlling the umbilical interface.

### Hot Swapping
Since the interface is so clean, you can potentially replace a running component with a different implementation that uses the same umbilical contract.

### Framework Agnostic
The protocol makes no assumptions about internal implementation. Components can use classes, closures, async logic, state machines, or any other patterns internally.

## Implementation Notes

### Schema Discovery
The protocol doesn't prescribe how components should expose their requirements. This is intentionally left as an implementation detail that can evolve naturally:

- Components might return JSON schemas
- Components might accept introspection umbilicals
- Components might use progressive disclosure
- Conventions will emerge organically based on ecosystem needs

### Error Handling
Components that receive inadequate umbilicals should handle this gracefully, potentially through:
- Validation during initialization
- Degraded functionality modes
- Clear error messaging through umbilical channels

### Lifecycle Management
Component cleanup and lifecycle management happens through the umbilical:

```js
Component.create({
  dom: element,
  lifecycle: {
    onMount: () => {},
    onUnmount: () => {},
    onDestroy: cleanupCallback
  }
})
```

## Philosophy

This protocol represents the **assembly language of component systems** - a minimal, powerful primitive that higher-level patterns can build upon. 

The elegance lies in **not prescribing those patterns.** Instead, it provides a simple constraint that naturally leads to better architecture:

- Explicit dependencies
- Perfect testability  
- Clear boundaries
- Unlimited internal flexibility

By forcing all external interaction through a single channel, components become pure functions of their environment while retaining complete internal autonomy.

## Summary

**One function. One parameter. Infinite possibilities.**

The umbilical component protocol reduces component architecture to its essence: give a component its world, and let it build itself however it sees fit within that world.