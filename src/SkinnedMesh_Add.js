THREE.SEA3D.SkinnedMesh.prototype.resetAnim = function () {

    this.anim = { name:'', time:0, frame:0, end:0 }

};

THREE.SEA3D.SkinnedMesh.prototype.getAnim = function () {

    if( !this.anim ) this.resetAnim();

    var animation = this.currentAnimation;

    if( !animation ) { this.resetAnim(); return; }

    this.anim.name = animation.name;
    this.anim.time = animation.clip.frameTime;
    var r = 1 / this.anim.time;
    this.anim.frame = Math.round( this.currentAnimationAction.time * r );
    this.anim.end = Math.round( animation.clip.duration * r );

};

THREE.SEA3D.SkinnedMesh.prototype.playFrame = function ( f, max ) {


	var animation = this.currentAnimation;
	if( !animation ) { return; }
	var name = animation.name;
	var time = animation.duration/max;//clip.frameTime;
	//var ratio = 1 / time;
    this.unPauseAll()
	this.play( name, 0, f*time )
	this.pauseAll()

	//console.log(name, animation)


};