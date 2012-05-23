# Deploying New Relic monitoring on Coldfusion 9

At ETBD we have begun the shift towards Rails as our preferred development platform. New Relic is a great fit for a rails deployment, and my previous experience with NR has been positive. That leaves us with a significant amount of legacy Coldfusion code which is not monitored in a conherent or comprehensive manner. It would be nice if our approach to monitoring was homogenous. New Relic lists Coldfusion as a supported framework, so I downloaded it and kicked the tires.

# Installation
The java version of NR is shipped as two jars, one which performs the actual monitoring and one which provides an api to call the monitoring functionality. There is also a configuration file which controls some of the monitoring options.

The NR jar needs to be added as the javaagent in the java.args line of Coldfusion9/runtime/bin/jvm.config.

    -javaagent:c:/Projects/cf-common/libraries/newrelic/newrelic.jar
I also set the environment name for this server on the same line,

    -Dnewrelic.environment=waikuku
which allows us to distinguish between dev and live applications.

Having to modify this for every server is unfortunate. For us it means that the jar file cannot be auto deployed, every CF instance needs to be restarted when there are modifications to the configuration file or a new version of NR is deployed.

Java doesnt understand windows path separators, make sure to use forward slashes when specifying the path to the jar file. Java does understand UNC paths, so if your files are on a network share you can reference them directly without mapping the share locally. If the jvm cant find the jar coldfusion will not start.

It felt like it took longer to spin up the CF instance than previously, but I have not benchmarked it.

# Configuration
The default NR configuration does not provide particular useful names for CF code or applications.
Set the config entries for auto naming to true, this allows CF to change the values later.

    enable_auto_app_naming: true
    enable_auto_transaction_naming: true

With those settings transactions in NR will appear to come from `adobe_coldfusion` and the transaction will be named `cfml_servlet`.

Luckily a better application name can set in the config.

    app_name: Rick Steves

Best practice for security would be to have the logging transmitted over ssl.

    ssl: true

NR is unable to inject browser monitoring into the coldfusion response object.
    browser_monitoring:
     auto_instrument: false

I dont want different environments to all log with the same application name. The environment setting that was added to the jvm.config allows any of the global config entries to be overridden for each environment.


    live:
      <<: *default_settings
      app_name: live - Rick Steves

    uat:
      <<: *default_settings
      app_name: uat - Rick Steves

#Coldfusion
At this point NR is running within CF and reporting back to the NR site. SQL tracing works out of the box (at least for SQL Server). Error reporting does not work, browser monitoring does not work, cf applications on the same server all share the same application name, transactions all have the same name.

Most of those problems can fixed using the NR api jar. We use classloader to load jars at application startup from a deployable directory, rather than modifying the jvm classpath.

    application.javaLoader = createObject(
        "component",
        "shared.javaloader.JavaLoader"
    ).init( [
        "#application.commonPath#" &
        "#application.cfCommonSubPath#" &
        "/libraries/newrelic/newrelic-api.jar"
    ],
    false );

In `onRequestStart` method of `application.cfc` we set the application name and transaction name for every request. If you are still using application.cfm files then you would put it there (after cfapplication). NR uses an attribute in the servlet request object to name the application.

    var servletRequest = getPageContext().getRequest();
    local.servletRequest.setAttribute( "com.newrelic.agent.APPLICATION_NAME", "#application.config.environment# - #this.name#" );

I have chosen to name applications based on their environment, e.g. LIVE, DEV etc, concatenated with the CF application `this.name`. Putting the environment name first means that if the application list is sorted by name they will be grouped by environment. NR probably logs the environment set in the config file, but I have not seen any way to use that in the reporting interface.

Then I set the transaction name.

    this.newRelicApi = createObject( "java", "com.newrelic.api.agent.NewRelic" );
    this.newRelicApi.setTransactionName( "cfm page",  cgi.script_name );
The first argument to `setTransactionName` is the transaction group, which is not used by NR. You can make whatever you want to. The second argument is the transaction name. At this time I am just using the CF script name. If the NR config was set to not auto name transactions then it would do the same thing (uri based name). But in the future, should you wish to change the transaction naming, you would need to update the config and restart all of the CF instances to pick it up.

NR does not automatically pick up CF errors. However a cferror object can be passed to the api to be logged. This line is in the `onError` method. If errors are being caught and handled elsewhere then it would need to be added to that code as well.

    this.newRelicApi.noticeError( except );

#Client Side
I have not implemented the injection of code for the client side monitoring. NR provides methods in the api to get the scripts, one needs to be injected at the top of the page and on needs to go at the bottom of the page.

    this.newRelicApi.getBrowserTimingHeader();
    this.newRelicApi.getBrowserTimingFooter();

Currently our application.cfc framework does not provide hooks for injecting content into the page. Once I add that capability I will use those two calls to add instrumentation to every request.