# ServiceBus Listener - TACK

A containerised nodejs event listener that listens to Azure Service bus and passes requests on to an internal endpoint

## Environment Variables

The following environment variables need to be passed to the container:

### Logging
```
ENV TEAMNAME=[YourTeamName]
ENV APPINSIGHTS_KEY=[YourCustomApplicationInsightsKey] # Optional, create your own App Insights resource
ENV CHALLENGEAPPINSIGHTS_KEY=[Challenge Application Insights Key] # Given by the proctors
```
### Service bus
```
ENV SERVICEBUSCONNSTRING= "Endpoint=sb://[name].servicebus.windows.net/;SharedAccessKeyName=[policyname];SharedAccessKey=[accesskey]"
ENV SERVICEBUSQUEUENAME=[queueName]
```
### For Process Endpoint
```
ENV PROCESSENDPOINT=http://fulfillorder.[namespace].svc.cluster.local:8080/v1/order/
```