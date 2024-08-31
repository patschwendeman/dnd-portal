from typing import Dict, Any
from pydantic import BaseModel

class BattleMapUpdate(BaseModel):
    updates: Dict[str, Any]
