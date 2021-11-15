export class PriorityNode<T> {
    value: T

    priority: number

    next: PriorityNode<T>

    constructor(value: T, priority: number) {
        this.value = value
        this.priority = priority
    }
}
