THREE.SEA3D.SkinnedMesh.prototype.resetAnim = function () {

    this.anim = { name:'', time:0, frame:0, end:0 }

};

THREE.SEA3D.SkinnedMesh.prototype.getAnim = function () {

    if( !this.anim ) this.resetAnim();

    var animation = this.currentAnimation;
    if( !animation ) { this.resetAnim(); return; }
    this.anim.name = animation.name;
    this.anim.time = animation.clip.frameTime;
    var f = 1 / this.anim.time;
    this.anim.frame = Math.round( this.currentAnimationAction.time * f );
    this.anim.end = Math.round( animation.clip.duration * f );

};

THREE.SEA3D.SkinnedMesh.prototype.playFrame = function ( f ) {

	var animation = this.currentAnimation;
	if( !animation ) { return; }
	var name = animation.name;
	var frameTime = animation.clip.frameTime;
	var offset = f * frameTime;
	this.play( name, 0, offset, 1 );
	this.pauseAll();

};