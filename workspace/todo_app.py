from typing import List, Optional
from datetime import datetime
from dataclasses import dataclass

@dataclass
class TodoItem:
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    completed: bool = False

class TodoList:
    def __init__(self):
        self.items: List[TodoItem] = []
        self._next_id: int = 1

    def add_item(self, title: str, description: str = None, due_date: datetime = None) -> TodoItem:
        item = TodoItem(
            id=self._next_id,
            title=title,
            description=description,
            due_date=due_date
        )
        self.items.append(item)
        self._next_id += 1
        return item

    def get_item(self, item_id: int) -> Optional[TodoItem]:
        return next((item for item in self.items if item.id == item_id), None)

    def update_item(self, item_id: int, **kwargs) -> Optional[TodoItem]:
        item = self.get_item(item_id)
        if item:
            for key, value in kwargs.items():
                setattr(item, key, value)
        return item

    def delete_item(self, item_id: int) -> bool:
        item = self.get_item(item_id)
        if item:
            self.items.remove(item)
            return True
        return False

    def get_all_items(self) -> List[TodoItem]:
        return self.items.copy()

    def get_completed_items(self) -> List[TodoItem]:
        return [item for item in self.items if item.completed]

    def get_pending_items(self) -> List[TodoItem]:
        return [item for item in self.items if not item.completed]

# Example usage
if __name__ == "__main__":
    todo_list = TodoList()
    
    # Add some items
    todo_list.add_item("Complete project", "Finish the AI code editor project", datetime(2024, 2, 1))
    todo_list.add_item("Write tests", "Add unit tests for all components")
    todo_list.add_item("Update documentation", "Add API documentation and examples")
    
    # Mark an item as completed
    todo_list.update_item(1, completed=True)
    
    # Print all items
    print("\nAll items:")
    for item in todo_list.get_all_items():
        print(f"[{'x' if item.completed else ' '}] {item.title}") 