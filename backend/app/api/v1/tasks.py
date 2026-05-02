from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from app.api import deps
from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskUpdate, Task as TaskSchema

router = APIRouter()

@router.get("/", response_model=List[TaskSchema])
async def read_tasks(
    db: AsyncIOMotorDatabase = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    query = {}
    if current_user.get("role") != "admin":
        query["owner_id"] = str(current_user["id"])
    
    cursor = db.tasks.find(query).skip(skip).limit(limit)
    tasks = await cursor.to_list(length=limit)
    
    for task in tasks:
        task["id"] = str(task["_id"])
    return tasks

@router.post("/", response_model=TaskSchema)
async def create_task(
    *,
    db: AsyncIOMotorDatabase = Depends(get_db),
    task_in: TaskCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    task_dict = task_in.model_dump()
    task_dict["owner_id"] = str(current_user["id"])
    ist_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    task_dict["created_at"] = ist_time
    task_dict["updated_at"] = ist_time
    
    result = await db.tasks.insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    return task_dict

@router.put("/{id}", response_model=TaskSchema)
async def update_task(
    *,
    db: AsyncIOMotorDatabase = Depends(get_db),
    id: str,
    task_in: TaskUpdate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    try:
        obj_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
        
    task = await db.tasks.find_one({"_id": obj_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.get("role") != "admin" and task.get("owner_id") != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = task_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
    
    await db.tasks.update_one({"_id": obj_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"_id": obj_id})
    updated_task["id"] = str(updated_task["_id"])
    return updated_task

@router.delete("/{id}", response_model=TaskSchema)
async def delete_task(
    *,
    db: AsyncIOMotorDatabase = Depends(get_db),
    id: str,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    try:
        obj_id = ObjectId(id)
    except:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    task = await db.tasks.find_one({"_id": obj_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.get("role") != "admin" and task.get("owner_id") != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await db.tasks.delete_one({"_id": obj_id})
    task["id"] = str(task["_id"])
    return task
