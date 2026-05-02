from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"

class TaskCreate(TaskBase):
    title: str

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
