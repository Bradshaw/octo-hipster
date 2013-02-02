/*
Copyright (C) 2013 William James Dyce, Kevin Bradshaw Jean-Bapiste Subils

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//! ----------------------------------------------------------------------------
//! CONSTRUCTOR
//! ----------------------------------------------------------------------------

RobotPolice = function(id_, position_, skin_i_)
{
	this.init(id_, position_, skin_i_);
  return this;
}
//! ----------------------------------------------------------------------------
//! PROTOTYPE
//! ----------------------------------------------------------------------------

// inherits from Robot
RobotPolice.prototype = new Robot();
RobotPolice.prototype.TYPE = Robot.prototype.TYPE_POLICE;
RobotPolice.prototype.SPEED = 0.15; // 1.5 times faster than others
RobotPolice.prototype.radius = 16;
RobotPolice.prototype.radius2 = 
RobotPolice.prototype.radius * RobotPolice.prototype.radius;

//! ----------------------------------------------------------------------------
//! TYPE CHECKING
//! ----------------------------------------------------------------------------

// this is redundant, but makes code a lot easier to read
RobotPolice.prototype.isPolice = true;
RobotPolice.prototype.isHumanControlled = true;
  
//! ----------------------------------------------------------------------------
//! INITIALISATION
//! ----------------------------------------------------------------------------

RobotPolice.prototype.init = function(id_, position_, skin_i_)
{
  // default stuff
  Robot.prototype.init.call(this, id_, position_, skin_i_);
  
  // Police can fire their LAZOR
  this.lock_on = new Bank(0, 0, 2000);
  this.target = null;
}

//! ----------------------------------------------------------------------------
//! TARGETTING
//! ----------------------------------------------------------------------------

RobotPolice.prototype.setTarget = function(newTarget)
{
  if(this.target == newTarget)
    return;
  
  this.lock_on.setEmpty();
  this.target = newTarget;
}

RobotPolice.prototype.update = function(delta_t)
{
}