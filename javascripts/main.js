if(typeof window.jenkinsDash === 'undefined') window.jenkinsDash = {};

(function(jenkinsDash){
  var manager = {};
  manager.view = 'All';

  manager.update = function(data){
    var job, i, _i, j, _j,
        newProjects = false;

    for(i=0, _i=data.views.length; i<_i; i++){
      for(j=0, _j=data.views[i].jobs.length; j<_j; j++){
        job = jenkinsDash.Project.find(data.views[i].jobs[j]);
        if(job === false){
          job = new jenkinsDash.Project(data.views[i].jobs[j]);
          newProjects = true;
        } else {
          job.update(data.views[i].jobs[j]);
        }
        job.addView(data.views[i].name);
      }
    }
    if(newProjects){
      manager.redraw();
    }
    manager.refresh();
  };
  manager.refresh = function(){
    var failed = jenkinsDash.Project.findByStatus('failure'),
        unstable = jenkinsDash.Project.findByStatus('unstable'),
        failureAlert = document.querySelectorAll('.failure')[0];
        names = document.querySelectorAll('.failure .project-names')[0];

    if(failed.length){
      names.innerHTML = failed.map(function(job){ return job.name; }).join(', ');
      failureAlert.style.display = "block";
    } else {
      failureAlert.style.display = "none";
    }
  };
  manager.redraw = function(){
    var projects = jenkinsDash.Project.findByView(manager.view),
        columns = 4,
        tableSize = Math.ceil(projects.length / columns),
        i, _i, table, j, _j, html;

    for(i=0,_i=columns; i<_i; i++){
      html = []
      for(j=0,_j=tableSize; j<_j; j++){
        if(projects[(i*tableSize) + j]){
          html.push(projects[(i*tableSize) + j].render());
        }
      }
      table = document.querySelectorAll('.project-list #column-'+(i+1)+' tbody')[0];
      table.innerHTML = html.join('');
    }
  };

  manager.fetch = function(url, fn){
    var callback = 'callback' + Math.round(Math.random()*10000),
        script = document.getElementById('jsonp'),
        lastScript;

    window[callback] = (function(callback, fn){
      return function(data){
        fn(data);
        delete window[callback];
        script = document.getElementById('jsonp'),
        script.parentNode.removeChild(script);
      };
    }(callback, fn));

    if(!script){
      script = document.createElement('script');
      script.setAttribute('id', 'jsonp');
      lastScript = document.getElementsByTagName('script')[0];
      lastScript.parentNode.insertBefore(script,lastScript)
    }

    script.setAttribute('src', url + callback);
  };

  manager.login = function(user, pass){
    var iframe = document.createElement('iframe'),
        script = document.getElementsByTagName('script')[0];

    script.parentNode.insertBefore(iframe, script);
    iframe.contentDocument.body.innerHTML = '<form action="'+ jenkinsDash.settings.host +'/j_acegi_security_check" method="post">'
        + '<input type="hidden" name="j_username" value="'+ jenkinsDash.settings.user +'">'
        + '<input type="hidden" name="j_password" value="'+ jenkinsDash.settings.pass +'">'
        + '<input type="hidden" name="from" value="/api">'
      + '</form>';
    iframe.contentDocument.getElementsByTagName('form')[0].submit();
    window.setTimeout(function(){
      iframe.parentNode.removeChild(iframe);
    }, 10000);
  };

  manager.login();
  manager.interval = window.setInterval(function(){
    var updateUrl = jenkinsDash.settings.host + '/api/json?tree=views[name,jobs[name,lastCompletedBuild[result,duration,timestamp],lastBuild[result],healthReport[description,score],inQueue,buildable,color]]&jsonp=';
    manager.fetch(updateUrl, manager.update);
  }, 5000);

  jenkinsDash.manager = manager;
}(jenkinsDash));

