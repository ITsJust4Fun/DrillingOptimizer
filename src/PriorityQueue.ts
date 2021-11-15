import {PriorityNode} from './PriorityNode'

export class PriorityQueue<T> {
    private head: PriorityNode<T>

    private tail: PriorityNode<T>

    public enqueue(value: T, priority: number): PriorityNode<T> {
        const node = new PriorityNode(value, priority)
        if (!this.head) {
            this.head = this.tail = node
        } else {
            let previous = this.head
            if (previous.priority > priority) {
                node.next = previous
                this.head = node
                return node
            }
            let next = previous?.next
            while(previous && next) {
                if (next.priority > priority) {
                    node.next = next
                    previous.next = node
                    return node
                }
                previous = previous.next
                next = next.next
            }

            this.tail.next = node
            this.tail = node
        }
        return node
    }

    public dequeue(): PriorityNode<T> {
        if (!this.head) {
            return
        }
        const oldHead = this.head
        this.head  = oldHead.next
        return oldHead
    }

    public peek(): T {
        return this.head?.value
    }

    public isEmpty(): boolean {
        return this.head == null
    }

    public get data() {
        const values = []
        let head = this.head
        while (head) {
            values.push(head.value)
            head = head.next
        }
        return values
    }
}
